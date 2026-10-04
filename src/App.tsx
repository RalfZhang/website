import { Nav } from "./components/Nav";
import { RouterProvider, useRouter } from "./lib/router";
import { ThemeProvider } from "./lib/theme";
import { Contact } from "./pages/contact/Contact";
import { Home } from "./pages/home/Home";
import { NotFound } from "./pages/NotFound";
import { WorkPage } from "./pages/work/WorkPage";
import { Works } from "./pages/works/Works";

function Page() {
  const { route } = useRouter();
  switch (route.name) {
    case "home":
      return <Home />;
    case "works":
      return <Works />;
    case "work":
      return <WorkPage slug={route.slug} />;
    case "contact":
      return <Contact />;
    default:
      return <NotFound />;
  }
}

export function App() {
  return (
    <ThemeProvider>
      <RouterProvider>
        <Nav />
        <Page />
      </RouterProvider>
    </ThemeProvider>
  );
}
