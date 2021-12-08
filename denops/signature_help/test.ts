import { assertEquals } from "./deps.ts";
import { Config, makeConfig } from "./config.ts";

Deno.test("test makeConfig", () => {
  const userconfig: unknown = {
    border: false,
    maxWidth: 100,
  };
  assertEquals(makeConfig(userconfig as Config), {
    border: false,
    maxWidth: 100,
    maxHeight: 30,
    delay: 50,
    style: "full",
  });
});
