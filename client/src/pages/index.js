import Home from "./Home";
import AuthForm from "./AuthForm";
import Events from "./Events";
import Event from "./Event";
import RegistrationForm from "./RegistrationForm";
import TempForm from "./TempForm";
import Success from "./Success";
import Failure from "./Failure";
import About from "./landing/About";
import Features from "./landing/Features";
import Pricing from "./Pricing";
import EventCalendar from "./EventCalendar";
import OrganizerDashboard from "./OrganizerDashboard";
import Test from "./Test";

const router = [
  { path: "/", component: Home },
  { path: "/login", component: AuthForm },
  { path: "/events", component: Events },
  { path: "/form", component: TempForm },
  { path: "/success", component: Success },
  { path: "/failure", component: Failure },
  { path: "/events/:eventname", component: Event },
  { path: "/events/:eventname/register", component: RegistrationForm },
  { path: "/about", component: About },
  { path: "/features", component: Features },
  { path: "/calendar", component: EventCalendar },
  { path: "/pricing", component: Pricing },
  { path: "/event/orgdsh", component: OrganizerDashboard },
  { path: "/event/studsh", component: Test },
];

export default router;