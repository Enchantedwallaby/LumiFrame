import { Routes, Route, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Upload from "./pages/Upload";
import Gallery from "./pages/Gallery";
import PhotographerLogin from "./pages/PhotographerLogin";
import PhotographerDashboard from "./pages/PhotographerDashboard";
import PhotographerView from "./pages/PhotographerView";

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen relative text-light overflow-hidden font-inter">

      {/* 🌌 Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A021A] via-[#1B0E33] to-[#5A3FFF] animate-gradient-move"></div>
      <div className="absolute w-[1000px] h-[1000px] rounded-full bg-[#5A3FFF]/30 blur-[160px] top-[-300px] left-[-300px]"></div>
      <div className="absolute w-[800px] h-[800px] rounded-full bg-[#9D6CFF]/20 blur-[180px] bottom-[-300px] right-[-300px]"></div>

      {/* 🌙 Glass Navbar */}
      <nav className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 
                      w-[90%] md:w-[80%] lg:w-[70%]
                      backdrop-blur-2xl bg-[#1B0E33]/50 border border-[#5A3FFF]/40 
                      rounded-2xl shadow-[0_0_25px_rgba(157,108,255,0.3)]
                      px-6 py-3 flex justify-between items-center text-sm font-medium text-white">

        {/* 🌟 LumiFrame Logo */}
        <div className="flex items-center space-x-2 select-none">
          <span className="text-2xl font-extrabold tracking-tight">
            Lumi<span className="text-[#9D6CFF]">Frame</span>
          </span>
        </div>

        {/* 🧭 Navigation Links */}
        <div className="hidden md:flex space-x-6">
          <NavLink text="Register" path="/" />
          <NavLink text="Login" path="/login" />
          <NavLink text="Upload" path="/upload" />
          <NavLink text="Gallery" path="/gallery" />
        </div>

        {/* 👩‍💻 Right Section */}
        <div className="hidden md:flex space-x-6">
          <NavLink text="Photographer Login" path="/photographer" />
          <NavLink text="Dashboard" path="/photographer/dashboard" />
        </div>
      </nav>

      {/* 🔮 Main content with smooth transition */}
      <div className="pt-24 relative z-10 p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -25 }}
            transition={{ duration: 0.4 }}
          >
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/photographer" element={<PhotographerLogin />} />
              <Route path="/photographer/dashboard" element={<PhotographerDashboard />} />
              <Route path="/photographer/view/:username" element={<PhotographerView />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* 🔗 Reusable NavLink Component */
function NavLink({ text, path }) {
  const location = useLocation();
  const isActive = location.pathname === path;

  return (
    <Link
      to={path}
      className={`relative px-3 py-1 rounded-lg transition-all duration-300 
        ${
          isActive
            ? "bg-gradient-to-r from-[#5A3FFF] to-[#9D6CFF] text-white shadow-[0_0_15px_rgba(157,108,255,0.5)]"
            : "text-gray-300 hover:text-white hover:scale-105"
        }`}
    >
      {text}
    </Link>
  );
}

export default App;
