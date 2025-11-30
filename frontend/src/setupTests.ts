// Test setup for Vitest + Testing Library
import '@testing-library/jest-dom';

// Inform React testing environment helpers about act
// (this is safe for modern React versions used in the repo)
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
