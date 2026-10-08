"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import SocialLogin from "../../components/SocialLogin";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/slices/userSlice";

export default function LoginForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  // Sync session with Redux after login
  useEffect(() => {
    if (session?.user) {
      dispatch(setUser(session.user));
    }
  }, [session, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;

    setIsLoading(true);
    toast.loading("Signing in...");

    try {
      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      toast.dismiss();

      if (response?.ok) {
        toast.success("Signed in successfully!");
        router.push("/");
        form.reset();
      } else {
        toast.error("Invalid email or password");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Something went wrong. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Website Name - Top Left */}
      <Link href="/" className="absolute top-6 left-6 sm:top-8 sm:left-8">
        <h1 className="text-xl sm:text-2xl font-bold">
          <span className="text-gray-900">NEWS</span>
          <span className="text-gray-500/95">NEXUS</span>
        </h1>
      </Link>

      {/* Main Form Container */}
      <div className="w-full max-w-xl bg-white p-6 sm:p-10 lg:p-12">
        {/* Title */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
          Sign In
        </h2>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-gray-600 mb-8 sm:mb-10">
          Don't have an account yet?{" "}
          <Link
            href="/signup"
            className="text-[#104AC2] hover:text-[#1C3B7A] font-medium transition-colors"
          >
            Create Your Account
          </Link>
        </p>

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="mb-5 sm:mb-6">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
              disabled={isLoading}
              className="w-full px-4 py-3 sm:py-4 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#104AC2] focus:border-transparent disabled:opacity-50 transition-all"
            />
          </div>

          {/* Password Input */}
          <div className="mb-6 sm:mb-8">
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              disabled={isLoading}
              className="w-full px-4 py-3 sm:py-4 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#104AC2] focus:border-transparent disabled:opacity-50 transition-all"
            />
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#104AC2] to-[#1C3B7A] hover:from-[#0d3da3] hover:to-[#152f61] text-white font-semibold py-3 sm:py-4 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6 sm:mb-8 text-sm sm:text-base shadow-md hover:shadow-lg"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative mb-6 sm:mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs sm:text-sm">
            <span className="px-4 bg-white text-gray-500">or</span>
          </div>
        </div>

        {/* Social Login */}
        <SocialLogin />
      </div>
    </div>
  );
}
