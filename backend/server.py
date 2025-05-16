from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Union, Any
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from bson import ObjectId
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT Settings
SECRET_KEY = os.environ.get("SECRET_KEY", "defaultsecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

# User role enum
class UserRole(str, Enum):
    USER = "user"
    CONTRIBUTOR = "contributor"
    MODERATOR = "moderator"
    ADMIN = "admin"

# Define Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    username: str
    hashed_password: str
    role: UserRole = UserRole.USER
    contributor_rank: int = 0  # Starting rank for contributors
    contribution_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    username: str
    role: UserRole
    contributor_rank: int
    contribution_count: int
    created_at: datetime

class UserInDB(User):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class Language(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str  # ISO 639-1 two-letter language code
    native_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Word(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    word: str
    language_id: str
    meanings: List[Dict[str, str]] = []  # [{"language_id": "...", "meaning": "..."}]
    created_by: str  # User ID
    last_modified_by: str  # User ID
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class WordCreate(BaseModel):
    word: str
    language_id: str
    meanings: List[Dict[str, str]]

class Contribution(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    word_id: str
    contribution_type: str  # "add", "edit", "translation"
    change_details: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user(username: str):
    user = await db.users.find_one({"username": username})
    if user:
        return UserInDB(**user)

async def authenticate_user(username: str, password: str):
    user = await get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except jwt.PyJWTError:
        raise credentials_exception
    user = await get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    return current_user

async def is_moderator(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return current_user

# Routes for Authentication
@api_router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    # Check if username already exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    existing_email = await db.users.find_one({"email": user_data.email})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user_in_db = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        role=UserRole.CONTRIBUTOR  # Start as contributor
    )
    
    # Insert into database
    await db.users.insert_one(user_in_db.dict())
    
    # Return user without password
    user_dict = user_in_db.dict()
    return UserResponse(**user_dict)

@api_router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# Language routes
@api_router.get("/languages", response_model=List[Language])
async def get_languages():
    languages = await db.languages.find().to_list(1000)
    return [Language(**language) for language in languages]

@api_router.post("/languages", response_model=Language)
async def create_language(language: Language, current_user: User = Depends(is_moderator)):
    # Only moderators can add languages
    language_dict = language.dict()
    await db.languages.insert_one(language_dict)
    return language

# Word and translation routes
@api_router.get("/words", response_model=List[Word])
async def get_words(language_id: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if language_id:
        query["language_id"] = language_id
    if search:
        query["word"] = {"$regex": search, "$options": "i"}  # Case-insensitive search
    
    words = await db.words.find(query).to_list(1000)
    return [Word(**word) for word in words]

@api_router.get("/words/{word_id}", response_model=Word)
async def get_word(word_id: str):
    word = await db.words.find_one({"id": word_id})
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    return Word(**word)

@api_router.post("/words", response_model=Word)
async def create_word(word_data: WordCreate, current_user: User = Depends(get_current_active_user)):
    # Create new word
    new_word = Word(
        word=word_data.word,
        language_id=word_data.language_id,
        meanings=word_data.meanings,
        created_by=current_user.id,
        last_modified_by=current_user.id
    )
    
    # Insert into database
    await db.words.insert_one(new_word.dict())
    
    # Record contribution
    contribution = Contribution(
        user_id=current_user.id,
        word_id=new_word.id,
        contribution_type="add",
        change_details={"word": word_data.word}
    )
    await db.contributions.insert_one(contribution.dict())
    
    # Update user contribution count and rank
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"contribution_count": 1}}
    )
    
    # Simple ranking algorithm - can be made more sophisticated
    if current_user.contribution_count % 10 == 0:
        await db.users.update_one(
            {"id": current_user.id},
            {"$inc": {"contributor_rank": 1}}
        )
    
    return new_word

@api_router.put("/words/{word_id}", response_model=Word)
async def update_word(
    word_id: str, 
    word_data: Dict[str, Any] = Body(...), 
    current_user: User = Depends(get_current_active_user)
):
    # Find the word
    word = await db.words.find_one({"id": word_id})
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    
    # Update the word
    update_data = {
        "last_modified_by": current_user.id,
        "updated_at": datetime.utcnow()
    }
    
    for field, value in word_data.items():
        if field in ["word", "meanings"]:
            update_data[field] = value
    
    await db.words.update_one(
        {"id": word_id},
        {"$set": update_data}
    )
    
    # Record contribution
    contribution = Contribution(
        user_id=current_user.id,
        word_id=word_id,
        contribution_type="edit",
        change_details=word_data
    )
    await db.contributions.insert_one(contribution.dict())
    
    # Update user contribution count and rank
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"contribution_count": 1}}
    )
    
    # Simple ranking algorithm - can be made more sophisticated
    if current_user.contribution_count % 10 == 0:
        await db.users.update_one(
            {"id": current_user.id},
            {"$inc": {"contributor_rank": 1}}
        )
    
    # Return updated word
    updated_word = await db.words.find_one({"id": word_id})
    return Word(**updated_word)

@api_router.get("/search", response_model=List[Word])
async def search_words(word: str, from_language: Optional[str] = None, to_language: Optional[str] = None):
    query = {"word": {"$regex": f"^{word}", "$options": "i"}}
    
    if from_language:
        query["language_id"] = from_language
    
    words = await db.words.find(query).to_list(100)
    result = [Word(**w) for w in words]
    
    # Filter for translations to specific language if requested
    if to_language and result:
        filtered_results = []
        for word in result:
            filtered_meanings = [m for m in word.meanings if m.get("language_id") == to_language]
            if filtered_meanings:
                word_copy = word.dict()
                word_copy["meanings"] = filtered_meanings
                filtered_results.append(Word(**word_copy))
        return filtered_results
    
    return result

@api_router.get("/user/{user_id}/contributions", response_model=List[Contribution])
async def get_user_contributions(user_id: str, current_user: User = Depends(get_current_active_user)):
    # Users can see their own contributions, moderators can see anyone's
    if current_user.id != user_id and current_user.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to view these contributions")
    
    contributions = await db.contributions.find({"user_id": user_id}).to_list(1000)
    return [Contribution(**contribution) for contribution in contributions]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize with some common languages
@app.on_event("startup")
async def startup_db_client():
    # Check if languages collection is empty
    count = await db.languages.count_documents({})
    if count == 0:
        # Add some common languages
        common_languages = [
            {"id": str(uuid.uuid4()), "name": "English", "code": "en", "native_name": "English"},
            {"id": str(uuid.uuid4()), "name": "Spanish", "code": "es", "native_name": "Español"},
            {"id": str(uuid.uuid4()), "name": "French", "code": "fr", "native_name": "Français"},
            {"id": str(uuid.uuid4()), "name": "German", "code": "de", "native_name": "Deutsch"},
            {"id": str(uuid.uuid4()), "name": "Chinese", "code": "zh", "native_name": "中文"},
            {"id": str(uuid.uuid4()), "name": "Japanese", "code": "ja", "native_name": "日本語"},
            {"id": str(uuid.uuid4()), "name": "Russian", "code": "ru", "native_name": "Русский"},
            {"id": str(uuid.uuid4()), "name": "Arabic", "code": "ar", "native_name": "العربية"},
            {"id": str(uuid.uuid4()), "name": "Hindi", "code": "hi", "native_name": "हिन्दी"},
            {"id": str(uuid.uuid4()), "name": "Portuguese", "code": "pt", "native_name": "Português"}
        ]
        # Insert languages
        await db.languages.insert_many(common_languages)
        
        # Create a default admin user if it doesn't exist
        admin_exists = await db.users.find_one({"username": "admin"})
        if not admin_exists:
            admin_user = User(
                email="admin@example.com",
                username="admin",
                hashed_password=get_password_hash("admin123"),  # This should be changed in production
                role=UserRole.ADMIN
            )
            await db.users.insert_one(admin_user.dict())
            
        logger.info("Initialized database with common languages and admin user")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
