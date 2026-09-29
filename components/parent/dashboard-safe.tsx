"use client";

import { Component, type ReactNode } from "react";

/** One widget throw must not take down Parent HQ. */
export class DashboardSafe extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
