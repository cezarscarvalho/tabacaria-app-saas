import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
