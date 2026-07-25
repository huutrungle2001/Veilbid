import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { App } from "../src/shell/App";

export default function TenderRoomPage() {
  const Router = typeof window === "undefined" ? MemoryRouter : BrowserRouter;
  return (
    <Router>
      <App />
    </Router>
  );
}

export function getServerSideProps() {
  return { props: {} };
}
