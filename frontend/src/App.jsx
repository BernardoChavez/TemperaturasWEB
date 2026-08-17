import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import ReportList from "./components/ReportList";
import ReportViewer from "./components/ReportViewer";
import Configuracion from "./components/Configuracion";
import Historico from "./components/Historico";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="reportes" element={<ReportList />} />
          <Route path="reportes/:filename" element={<ReportViewer />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="historico" element={<Historico />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
