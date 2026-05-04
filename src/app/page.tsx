"use client";

import { ArrowRight, Zap, Lock, RefreshCw, Users, Clock } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Event Operations Platform{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Reimagined
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
            Plan, execute, and analyze events with ease. Role‑based dashboards,
            real‑time updates, and a beautiful interface – all in one place.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-md bg-gray-800 px-6 py-3 text-sm font-semibold text-gray-200 shadow-sm ring-1 ring-inset ring-gray-700 hover:bg-gray-700"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid – dark cards */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything you need to run successful events
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Designed for organizers, vendors, staff, and attendees.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 shadow-sm transition-all hover:shadow-md hover:border-gray-700"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900/50 text-blue-400">
                  {feature.icon}
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-r from-blue-900 to-cyan-800 px-6 py-12 text-center shadow-xl">
          <h2 className="text-3xl font-bold text-white">
            Ready to transform your events?
          </h2>
          <p className="mt-4 text-blue-100">
            Join hundreds of organizers who use EventOps daily.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center rounded-md bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100"
          >
            Start Free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

const features = [
  {
    title: "Real‑time sync",
    description: "Updates flow instantly – from check‑ins to task completions.",
    icon: <Zap className="h-6 w-6" />,
  },
  {
    title: "Role‑based access",
    description:
      "Organizers, vendors, staff, and attendees see only what they need.",
    icon: <Users className="h-6 w-6" />,
  },
  {
    title: "Privacy first",
    description: "Your data stays yours. No third‑party tracking.",
    icon: <Lock className="h-6 w-6" />,
  },
  {
    title: "Lightning fast",
    description: "Optimized for speed – pages load in under 2 seconds.",
    icon: <Clock className="h-6 w-6" />,
  },
  {
    title: "Auto updates",
    description: "No manual refresh needed. Live dashboards.",
    icon: <RefreshCw className="h-6 w-6" />,
  },
  {
    title: "Batch operations",
    description: "Approve vendors, assign tasks – all in bulk.",
    icon: <ArrowRight className="h-6 w-6" />,
  },
];
