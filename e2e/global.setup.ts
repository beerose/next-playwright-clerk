import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import path from "path";

// Ensures that Clerk setup is done before any tests run
setup.describe.configure({
  mode: "serial",
});

setup("global setup", async () => {
  await clerkSetup();
});
