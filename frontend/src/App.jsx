import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "@/pages/Home";
import Connexion from "@/pages/Connexion";
import Inscription from "@/pages/Inscription";
import NotFound from "@/pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/connexion" element={<Connexion />} />
        <Route path="/inscription" element={<Inscription />} />
        <Route
          path="/enseignant"
          element={<div className="p-10">Espace enseignant</div>}
        />
        <Route
          path="/etudiant"
          element={<div className="p-10">Espace étudiant</div>}
        />
        <Route
          path="/admin"
          element={<div className="p-10">Espace administrateur</div>}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;