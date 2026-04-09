import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import TranslatePage from './pages/TranslatePage'
import EvaluatePage from './pages/EvaluatePage'
import PromptsPage from './pages/PromptsPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<TranslatePage />} />
          <Route path="evaluate" element={<EvaluatePage />} />
          <Route path="prompts" element={<PromptsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
