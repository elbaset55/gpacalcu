export const lovable = {
  auth: {
    signInWithOAuth: async () => {
      if (typeof window !== "undefined") {
        window.location.href = "/api/auth/login";
      }
      return { redirected: true };
    },
  },
};
