import "@testing-library/jest-dom";
import { vi } from "vitest";

// Optional: clean up mocks or globally mock browser APIs if needed
// e.g. mock window.matchMedia or window.scrollTo if required by component styles
window.scrollTo = vi.fn();
