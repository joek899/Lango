import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth context
import { createContext, useContext } from "react";

// Create context
const AuthContext = createContext(null);

// Auth Provider component
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (token in localStorage)
    const token = localStorage.getItem("token");
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const response = await axios.post(`${API}/token`, formData);
      const { access_token } = response.data;

      // Save token to localStorage
      localStorage.setItem("token", access_token);

      // Fetch user profile
      await fetchUserProfile(access_token);
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      return {
        success: false,
        message: error.response?.data?.detail || "Login failed",
      };
    }
  };

  const register = async (email, username, password) => {
    try {
      const response = await axios.post(`${API}/register`, {
        email,
        username,
        password,
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Registration failed:", error);
      return {
        success: false,
        message: error.response?.data?.detail || "Registration failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
function useAuth() {
  return useContext(AuthContext);
}

// Protected Route component
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Components
const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          LangHub
        </Link>
        <div className="flex space-x-4 items-center">
          <Link to="/" className="hover:text-gray-300">
            Home
          </Link>
          <Link to="/dictionary" className="hover:text-gray-300">
            Dictionary
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/contribute" className="hover:text-gray-300">
                Contribute
              </Link>
              <Link to="/profile" className="hover:text-gray-300">
                Profile ({user?.username})
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const Home = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-xl p-8 mb-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to LangHub</h1>
        <p className="text-xl mb-6">
          A collaborative platform for language enthusiasts to contribute and explore languages from around the world.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/dictionary"
            className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-2 px-6 rounded-full transition duration-300"
          >
            Explore Dictionary
          </Link>
          <Link
            to="/contribute"
            className="bg-transparent hover:bg-white hover:text-blue-600 text-white font-bold py-2 px-6 border-2 border-white rounded-full transition duration-300"
          >
            Start Contributing
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl text-blue-500 mb-4">🔍</div>
          <h2 className="text-xl font-bold mb-2">Search Words</h2>
          <p className="text-gray-600">
            Find translations and meanings for words in multiple languages.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl text-blue-500 mb-4">✏️</div>
          <h2 className="text-xl font-bold mb-2">Contribute</h2>
          <p className="text-gray-600">
            Add new words, meanings, and translations to help grow our language database.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl text-blue-500 mb-4">🏆</div>
          <h2 className="text-xl font-bold mb-2">Earn Recognition</h2>
          <p className="text-gray-600">
            Build your contributor ranking and get recognized for your contributions.
          </p>
        </div>
      </div>

      <div className="bg-gray-100 p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">Featured Languages</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {["English", "Spanish", "French", "German", "Chinese", "Japanese", "Russian", "Arabic", "Hindi", "Portuguese"].map((lang) => (
            <div key={lang} className="bg-white p-4 rounded-lg shadow text-center">
              <p className="font-medium">{lang}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    const result = await login(username, password);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="flex justify-center items-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { email, username, password, confirmPassword } = formData;

    // Validation
    if (!email || !username || !password) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const result = await register(email, username, password);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="flex justify-center items-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        {success ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            Registration successful! Redirecting to login...
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="username" className="sr-only">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Register
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const Dictionary = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [fromLanguage, setFromLanguage] = useState("");
  const [toLanguage, setToLanguage] = useState("");
  const [languages, setLanguages] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch languages on component mount
    const fetchLanguages = async () => {
      try {
        const response = await axios.get(`${API}/languages`);
        setLanguages(response.data);
      } catch (err) {
        console.error("Error fetching languages:", err);
        setError("Failed to load languages");
      }
    };

    fetchLanguages();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await axios.get(`${API}/search`, {
        params: {
          word: searchTerm,
          from_language: fromLanguage || undefined,
          to_language: toLanguage || undefined,
        },
      });
      setResults(response.data);
      if (response.data.length === 0) {
        setError("No results found");
      }
    } catch (err) {
      console.error("Error searching:", err);
      setError("An error occurred while searching");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Dictionary Search</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="search">
                Search Word
              </label>
              <input
                id="search"
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter a word to search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fromLanguage">
                From Language
              </label>
              <select
                id="fromLanguage"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={fromLanguage}
                onChange={(e) => setFromLanguage(e.target.value)}
              >
                <option value="">Any Language</option>
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="toLanguage">
                To Language
              </label>
              <select
                id="toLanguage"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={toLanguage}
                onChange={(e) => setToLanguage(e.target.value)}
              >
                <option value="">Any Language</option>
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-center">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Search Results</h2>
          <div className="space-y-4">
            {results.map((word) => {
              // Find language name from ID
              const sourceLang = languages.find((l) => l.id === word.language_id)?.name || "Unknown";
              
              return (
                <div key={word.id} className="border-b pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{word.word}</h3>
                      <p className="text-sm text-gray-600">{sourceLang}</p>
                    </div>
                  </div>
                  
                  {word.meanings.length > 0 ? (
                    <div className="mt-2">
                      <h4 className="font-medium">Translations:</h4>
                      <ul className="ml-5 list-disc">
                        {word.meanings.map((meaning, index) => {
                          const targetLang = languages.find((l) => l.id === meaning.language_id)?.name || "Unknown";
                          
                          return (
                            <li key={index}>
                              <span className="font-medium">{targetLang}:</span> {meaning.meaning}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic mt-2">No translations available</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const Contribute = () => {
  const [tab, setTab] = useState("word"); // "word" or "language"
  const [step, setStep] = useState(1);
  const [languages, setLanguages] = useState([]);
  const [formData, setFormData] = useState({
    word: "",
    languageId: "",
    meanings: [],
  });
  const [languageData, setLanguageData] = useState({
    name: "",
    code: "",
    native_name: "",
  });
  const [targetLanguageId, setTargetLanguageId] = useState("");
  const [targetMeaning, setTargetMeaning] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    // Fetch languages
    const fetchLanguages = async () => {
      try {
        const response = await axios.get(`${API}/languages`);
        setLanguages(response.data);
        if (response.data.length > 0) {
          // Find English as default or use first language
          const englishLang = response.data.find((lang) => lang.code === "en");
          setFormData((prev) => ({
            ...prev,
            languageId: englishLang ? englishLang.id : response.data[0].id,
          }));
        }
      } catch (err) {
        console.error("Error fetching languages:", err);
        setError("Failed to load languages");
      }
    };

    fetchLanguages();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLanguageChange = (e) => {
    const { name, value } = e.target;
    setLanguageData((prev) => ({ ...prev, [name]: value }));
  };

  const addMeaning = () => {
    if (!targetLanguageId || !targetMeaning) {
      setError("Please select a language and enter a meaning");
      return;
    }

    // Check if meaning for this language already exists
    const existingIndex = formData.meanings.findIndex(
      (m) => m.language_id === targetLanguageId
    );

    if (existingIndex >= 0) {
      // Update existing meaning
      const updatedMeanings = [...formData.meanings];
      updatedMeanings[existingIndex] = {
        language_id: targetLanguageId,
        meaning: targetMeaning,
      };
      setFormData((prev) => ({ ...prev, meanings: updatedMeanings }));
    } else {
      // Add new meaning
      setFormData((prev) => ({
        ...prev,
        meanings: [
          ...prev.meanings,
          { language_id: targetLanguageId, meaning: targetMeaning },
        ],
      }));
    }

    // Reset inputs
    setTargetLanguageId("");
    setTargetMeaning("");
    setError("");
  };

  const removeMeaning = (index) => {
    const updatedMeanings = [...formData.meanings];
    updatedMeanings.splice(index, 1);
    setFormData((prev) => ({ ...prev, meanings: updatedMeanings }));
  };

  const nextStep = () => {
    if (step === 1) {
      if (tab === "word" && (!formData.word || !formData.languageId)) {
        setError("Please enter a word and select its language");
        return;
      }
      if (tab === "language" && (!languageData.name || !languageData.code)) {
        setError("Please enter a language name and code");
        return;
      }
    }
    setError("");
    setStep(step + 1);
  };

  const prevStep = () => {
    setError("");
    setStep(step - 1);
  };

  const handleSubmitWord = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.meanings.length === 0) {
      setError("Please add at least one translation or meaning");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API}/words`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess("Word successfully added to the dictionary!");
      
      // Reset form
      setFormData({
        word: "",
        languageId: languages.find((lang) => lang.code === "en")?.id || languages[0]?.id,
        meanings: [],
      });
      
      // Go back to step 1
      setStep(1);
    } catch (err) {
      console.error("Error adding word:", err);
      setError(err.response?.data?.detail || "Failed to add word");
    }
  };

  const handleSubmitLanguage = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!languageData.name || !languageData.code) {
      setError("Please enter a language name and code");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API}/languages`,
        languageData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess("Language successfully added to the platform!");
      
      // Reset form
      setLanguageData({
        name: "",
        code: "",
        native_name: "",
      });
      
      // Refresh languages list
      const langResponse = await axios.get(`${API}/languages`);
      setLanguages(langResponse.data);
      
      // Go back to step 1
      setStep(1);
    } catch (err) {
      console.error("Error adding language:", err);
      setError(err.response?.data?.detail || "Failed to add language");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Contribute to Dictionary</h1>
      
      {!user ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
          Please log in to contribute to the dictionary.
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <div className="flex justify-center space-x-4 mb-6">
              <button
                onClick={() => { setTab("word"); setStep(1); setError(""); }}
                className={`px-4 py-2 rounded-md ${
                  tab === "word"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                Add Word
              </button>
              <button
                onClick={() => { setTab("language"); setStep(1); setError(""); }}
                className={`px-4 py-2 rounded-md ${
                  tab === "language"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                Add Language
              </button>
            </div>

            {tab === "word" && (
              <div className="flex items-center">
                <div className={`flex-1 border-t-2 ${step >= 1 ? "border-blue-500" : "border-gray-200"}`}></div>
                <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
                  step >= 1 ? "bg-blue-500 text-white" : "bg-gray-200"
                } mx-2`}>
                  1
                </div>
                <div className={`flex-1 border-t-2 ${step >= 2 ? "border-blue-500" : "border-gray-200"}`}></div>
                <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
                  step >= 2 ? "bg-blue-500 text-white" : "bg-gray-200"
                } mx-2`}>
                  2
                </div>
                <div className={`flex-1 border-t-2 ${step >= 3 ? "border-blue-500" : "border-gray-200"}`}></div>
                <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
                  step >= 3 ? "bg-blue-500 text-white" : "bg-gray-200"
                } mx-2`}>
                  3
                </div>
                <div className={`flex-1 border-t-2 ${step >= 3 ? "border-blue-500" : "border-gray-200"}`}></div>
              </div>
            )}
            
            {tab === "language" && (
              <div className="flex items-center">
                <div className={`flex-1 border-t-2 ${step >= 1 ? "border-blue-500" : "border-gray-200"}`}></div>
                <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
                  step >= 1 ? "bg-blue-500 text-white" : "bg-gray-200"
                } mx-2`}>
                  1
                </div>
                <div className={`flex-1 border-t-2 ${step >= 2 ? "border-blue-500" : "border-gray-200"}`}></div>
                <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
                  step >= 2 ? "bg-blue-500 text-white" : "bg-gray-200"
                } mx-2`}>
                  2
                </div>
                <div className={`flex-1 border-t-2 ${step >= 2 ? "border-blue-500" : "border-gray-200"}`}></div>
              </div>
            )}
            
            <div className="flex justify-between px-6 mt-2">
              {tab === "word" ? (
                <>
                  <div className="text-center">
                    <p className={`text-sm ${step >= 1 ? "text-blue-500" : "text-gray-500"}`}>
                      Enter Word
                    </p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm ${step >= 2 ? "text-blue-500" : "text-gray-500"}`}>
                      Add Meanings
                    </p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm ${step >= 3 ? "text-blue-500" : "text-gray-500"}`}>
                      Review & Submit
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <p className={`text-sm ${step >= 1 ? "text-blue-500" : "text-gray-500"}`}>
                      Enter Language Details
                    </p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm ${step >= 2 ? "text-blue-500" : "text-gray-500"}`}>
                      Review & Submit
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
              {success}
            </div>
          )}

          {tab === "word" ? (
            <form onSubmit={handleSubmitWord}>
              {step === 1 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Enter Word</h2>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="word">
                      Word
                    </label>
                    <input
                      id="word"
                      name="word"
                      type="text"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Enter a word"
                      value={formData.word}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="languageId">
                      Language
                    </label>
                    <select
                      id="languageId"
                      name="languageId"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      value={formData.languageId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Language</option>
                      {languages.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.name} {lang.native_name ? `(${lang.native_name})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      onClick={nextStep}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Add Meanings & Translations</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="targetLanguageId">
                        Target Language
                      </label>
                      <select
                        id="targetLanguageId"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={targetLanguageId}
                        onChange={(e) => setTargetLanguageId(e.target.value)}
                      >
                        <option value="">Select Language</option>
                        {languages
                          .filter((lang) => lang.id !== formData.languageId) // Exclude the word's language
                          .map((lang) => (
                            <option key={lang.id} value={lang.id}>
                              {lang.name} {lang.native_name ? `(${lang.native_name})` : ''}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="targetMeaning">
                        Meaning/Translation
                      </label>
                      <div className="flex">
                        <input
                          id="targetMeaning"
                          type="text"
                          className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          placeholder="Enter meaning or translation"
                          value={targetMeaning}
                          onChange={(e) => setTargetMeaning(e.target.value)}
                        />
                        <button
                          type="button"
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-r focus:outline-none focus:shadow-outline"
                          onClick={addMeaning}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {formData.meanings.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold mb-2">Added Translations:</h3>
                      <div className="space-y-2">
                        {formData.meanings.map((meaning, index) => {
                          const lang = languages.find((l) => l.id === meaning.language_id);
                          return (
                            <div key={index} className="flex justify-between items-center bg-gray-100 p-3 rounded">
                              <div>
                                <span className="font-medium">{lang?.name || "Unknown"}:</span> {meaning.meaning}
                              </div>
                              <button
                                type="button"
                                className="text-red-600 hover:text-red-800"
                                onClick={() => removeMeaning(index)}
                              >
                                ✖
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <button
                      type="button"
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      onClick={prevStep}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      onClick={nextStep}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Review & Submit</h2>
                  <div className="bg-gray-100 p-4 rounded mb-6">
                    <h3 className="text-lg font-bold">{formData.word}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Language: {languages.find((l) => l.id === formData.languageId)?.name || "Unknown"}
                    </p>
                    
                    <h4 className="font-medium mb-2">Translations:</h4>
                    {formData.meanings.length > 0 ? (
                      <ul className="list-disc pl-5">
                        {formData.meanings.map((meaning, index) => {
                          const lang = languages.find((l) => l.id === meaning.language_id);
                          return (
                            <li key={index}>
                              <span className="font-medium">{lang?.name || "Unknown"}:</span> {meaning.meaning}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="italic text-gray-500">No translations added</p>
                    )}
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      type="button"
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      onClick={prevStep}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      Submit Contribution
                    </button>
                  </div>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleSubmitLanguage}>
              {step === 1 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Enter Language Details</h2>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                      Language Name (English)
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="e.g. French, Japanese, Arabic"
                      value={languageData.name}
                      onChange={handleLanguageChange}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="code">
                      Language Code (ISO 639-1)
                    </label>
                    <input
                      id="code"
                      name="code"
                      type="text"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="e.g. fr, ja, ar (2 letters)"
                      value={languageData.code}
                      onChange={handleLanguageChange}
                      maxLength={2}
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Two-letter code according to ISO 639-1 standard
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="native_name">
                      Native Name (Optional)
                    </label>
                    <input
                      id="native_name"
                      name="native_name"
                      type="text"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="e.g. Français, 日本語, العربية"
                      value={languageData.native_name}
                      onChange={handleLanguageChange}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      The name of the language in the language itself
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      onClick={nextStep}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Review & Submit Language</h2>
                  <div className="bg-gray-100 p-4 rounded mb-6">
                    <h3 className="text-lg font-bold">{languageData.name}</h3>
                    <div className="mt-2 space-y-2">
                      <p><span className="font-medium">Language Code:</span> {languageData.code}</p>
                      {languageData.native_name && (
                        <p><span className="font-medium">Native Name:</span> {languageData.native_name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      type="button"
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      onClick={prevStep}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      Add Language
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
};

const Profile = () => {
  const { user } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchContributions = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API}/user/${user.id}/contributions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setContributions(response.data);
      } catch (err) {
        console.error("Error fetching contributions:", err);
        setError("Failed to load your contributions");
      } finally {
        setLoading(false);
      }
    };

    fetchContributions();
  }, [user]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin": return "bg-red-500";
      case "moderator": return "bg-yellow-500";
      case "contributor": return "bg-green-500";
      default: return "bg-blue-500";
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <h1 className="text-2xl font-bold">{user.username}'s Profile</h1>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Account Information</h2>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Email:</span> {user.email}
                </p>
                <p>
                  <span className="font-medium">Role:</span>{" "}
                  <span className={`${getRoleBadgeColor(user.role)} text-white text-sm py-1 px-2 rounded-full`}>
                    {user.role}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Member since:</span>{" "}
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-4">Contribution Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-600">{user.contribution_count}</p>
                  <p className="text-sm text-gray-600">Contributions</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-600">{user.contributor_rank}</p>
                  <p className="text-sm text-gray-600">Contributor Rank</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="border-b p-4">
          <h2 className="text-xl font-bold">Contribution History</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : contributions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            You haven't made any contributions yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Word ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contributions.map((contribution) => (
                  <tr key={contribution.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(contribution.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        contribution.contribution_type === "add" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {contribution.contribution_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contribution.word_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                      {contribution.change_details.word && (
                        <span>Word: {contribution.change_details.word}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="App min-h-screen bg-gray-100">
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dictionary" element={<Dictionary />} />
            <Route
              path="/contribute"
              element={
                <RequireAuth>
                  <Contribute />
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;
