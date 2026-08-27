import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import PrivateRoute from './utils/PrivateRoute'
import ScrollProgress from './components/common/ScrollProgress'
import BackToTop from './components/common/BackToTop'
import SmoothScroll from './components/common/SmoothScroll'
import { SystemFeedbackProvider } from './components/common/SystemFeedback/SystemFeedback'

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./views/home/Index'))
const ProductPage = lazy(() => import('./views/products/controller/Index'))
const ProductDetailPage = lazy(() => import('./views/products/detail/Index'))
const Login = lazy(() => import('./views/auth/Login/Index'))
const SignUp = lazy(() => import('./views/auth/SignUp/Index'))
const Portal = lazy(() => import('./views/portal/Index'))
const AdminDashboard = lazy(() => import('./views/dashboard/admin/Index'))
const HRDashboard = lazy(() => import('./views/dashboard/hr/Index'))
const EmployeeDashboard = lazy(() => import('./views/dashboard/employee/Index'))
const ModulePage = lazy(() => import('./views/dashboard/module-page/Index'))

import { 
  LuUser, 
  LuCalendarDays, 
  LuClipboardList, 
  LuPackage, 
  LuShoppingBag,
  LuUsers, 
  LuShieldCheck, 
  LuSettings, 
  LuHistory 
  ,LuFileText
} from 'react-icons/lu';
import { FiBarChart2 } from 'react-icons/fi';

// Loading fallback component
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)'
  }}>
    <div style={{ color: '#fff', fontSize: '1.2rem' }}>Loading...</div>
  </div>
)

const publicRegistrationEnabled =
  String(import.meta.env.VITE_ALLOW_PUBLIC_REGISTRATION).toLowerCase() === 'true'

const RegistrationRoute = () => (
  publicRegistrationEnabled
    ? <SignUp />
    : <Navigate to="/login" replace state={{ message: 'Public registration is currently closed. Contact an administrator for access.' }} />
)

const App = () => {
  return (
    <SystemFeedbackProvider>
      <SmoothScroll>
      <BrowserRouter>
        <ScrollProgress />
        <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/product' element={<ProductPage />} />
          <Route path='/products/:category' element={<ProductPage />} />
          <Route path='/product/:slug' element={<ProductDetailPage />} />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<RegistrationRoute />} />
          <Route path='/register' element={<RegistrationRoute />} />
          <Route path='/portal' element={<Portal />} />
          <Route path='/dashboard' element={<PrivateRoute />}>
            <Route path='superadmin' element={<AdminDashboard />} />
            <Route path='hr' element={<HRDashboard />} />
            <Route path='employee' element={<EmployeeDashboard />} />
            
            {/* Module Routes */}
            <Route path='profile' element={<ModulePage title="My Profile" icon={LuUser} />} />
            <Route path='leave/my' element={<ModulePage title="My Leave Requests" icon={LuCalendarDays} />} />
            <Route path='leave' element={<ModulePage title="Leave Management" icon={LuCalendarDays} />} />
            <Route path='logs/my' element={<ModulePage title="My Work Logs" icon={LuClipboardList} />} />
            <Route path='assets/my' element={<ModulePage title="My Assigned Assets" icon={LuPackage} />} />
            <Route path='employees' element={<ModulePage title="Employee Directory" icon={LuUsers} />} />
            <Route path='inventory' element={<ModulePage title="Inventory Management" icon={LuPackage} />} />
            <Route path='products' element={<ModulePage title="Product Management" icon={LuShoppingBag} />} />
            <Route path='reports' element={<ModulePage title="System Reports" icon={FiBarChart2} />} />
            <Route path='documents' element={<ModulePage title="Business Documents" icon={LuFileText} />} />
            <Route path='admin-panel' element={<ModulePage title="Admin Control Panel" icon={LuShieldCheck} />} />
            <Route path='audit' element={<ModulePage title="System Audit Logs" icon={LuHistory} />} />
            <Route path='settings' element={<ModulePage title="System Settings" icon={LuSettings} />} />
          </Route>
          <Route path='*' element={<HomePage />} />
        </Routes>
      </Suspense>
        <BackToTop />
      </BrowserRouter>
      </SmoothScroll>
    </SystemFeedbackProvider>
  )
}

export default App
