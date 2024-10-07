import './App.css';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Authentication from './pages/Authentication';
import { AuthProvider } from './contexts/AuthContext';
import VideoMeet from './pages/VideoMeet';
import HomeComponent from './pages/Home';
import History from './pages/History';

function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path='/' element={<LandingPage/>}></Route>
            <Route path='/auth' element={<Authentication/>}></Route>
            <Route path='/home' element={<HomeComponent />}></Route>
            <Route path='/:url' element={<VideoMeet/>}></Route>
            <Route path='/get_all_activity' element={<History/>}></Route>
          </Routes>
        </AuthProvider>

      </Router>
    </>
  );
}

export default App;
