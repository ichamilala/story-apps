import RegisterPage from '../pages/auth/register/register-page';
import LoginPage from '../pages/auth/login/login-page';
import HomePage from '../pages/home/home-page';
import BookmarkPage from '../pages/bookmark/bookmark-page';
import StoryDetailPage from '../pages/story-detail/story-detail-page';
import NewPage from '../pages/new/new-page';
import { checkAuthenticatedRoute, checkUnauthenticatedRouteOnly } from '../utils/auth';

export const routes = [
  {
    path: '/login',
    page: () => checkUnauthenticatedRouteOnly(new LoginPage()),
  },
  {
    path: '/register',
    page: () => checkUnauthenticatedRouteOnly(new RegisterPage()),
  },
  {
    path: '/',
    page: () => checkAuthenticatedRoute(new HomePage()),
  },
  {
    path: '/new',
    page: () => checkAuthenticatedRoute(new NewPage()),
  },
  {
    path: '/stories/:id',
    page: () => checkAuthenticatedRoute(new StoryDetailPage()),
  },
  {
    path: '/bookmark',
    page: () => checkAuthenticatedRoute(new BookmarkPage()),
  },
];
