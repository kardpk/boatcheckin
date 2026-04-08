// Mock for isomorphic-dompurify in test environment
export default {
  sanitize: (input: string) => input.trim(),
}
