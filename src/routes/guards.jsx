import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/store/selectors/authSelectors';
import { selectSelectedExamId } from '@/store/selectors/userSelectors';
import { PATHS } from './routePaths';

// Route guards render <Outlet/> when the rule passes and <Navigate/> when it does not.
// They replace the mobile RootNavigator / AppStack conditionals:
//   logged out            -> only the public pages
//   logged in, no exam    -> only exam onboarding
//   logged in, exam       -> the app

// Logged-in area. Remembers where the student was going so login can send them back.
export function RequireAuth() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to={PATHS.login} replace state={{ from: location }} />;
  }
  return <Outlet />;
}

// Login / OTP: a logged-in student has no business here.
export function PublicOnly() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();
  if (isAuthenticated) {
    const target = location.state?.from?.pathname ?? PATHS.home;
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
}

// The app proper needs a chosen exam (mobile: AppStack with `examId`).
export function RequireExam() {
  const examId = useSelector(selectSelectedExamId);
  if (!examId) {
    return <Navigate to={PATHS.onboardingExam} replace />;
  }
  return <Outlet />;
}

// Exam onboarding exists only until an exam is chosen (mobile: ExamOnboarding route).
export function OnboardingOnly() {
  const examId = useSelector(selectSelectedExamId);
  if (examId) {
    return <Navigate to={PATHS.home} replace />;
  }
  return <Outlet />;
}

// For in-flow pages that make no sense when opened directly (practice session, mock
// result, payment success...). `selector` returns something truthy when the flow state
// exists in Redux; otherwise the visitor is sent to `to`.
//   <Route element={<RequireFlow selector={selectPracticeSession} to="/tests" />}>
export function RequireFlow({ selector, to }) {
  const hasState = useSelector(selector);
  if (!hasState) {
    return <Navigate to={to} replace />;
  }
  return <Outlet />;
}
