import { BrowserRouter, Routes, Route } from "react-router";
import Room from "./pages/Room";
import Home from "./pages/Home";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="room" element={<Room />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
