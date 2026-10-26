import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/RequireAuth'
import { SiteHeader } from './components/SiteHeader'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { CourseDetailRoute } from './pages/panel/CourseDetail'
import { Courses } from './pages/panel/Courses'
import { Home } from './pages/panel/Home'
import { Lab } from './pages/panel/Lab'
import { MyCourses } from './pages/panel/MyCourses'
import { PanelLayout } from './pages/panel/PanelLayout'
import { Profiles } from './pages/panel/Profiles'
import { Token } from './pages/panel/Token'
import { Users } from './pages/panel/Users'

export function App() {
  return (
    <>
      <SiteHeader />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/panel"
            element={
              <RequireAuth>
                <PanelLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Home />} />
            <Route path="mis-cursos" element={<MyCourses />} />
            <Route path="cursos" element={<Courses />} />
            <Route path="cursos/:id" element={<CourseDetailRoute />} />
            <Route path="usuarios" element={<Users />} />
            <Route path="profesores" element={<Profiles key="professors" kind="professors" />} />
            <Route path="alumnos" element={<Profiles key="students" kind="students" />} />
            <Route path="laboratorio" element={<Lab />} />
            <Route path="token" element={<Token />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}
