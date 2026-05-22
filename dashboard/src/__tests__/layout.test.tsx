import React from "react";
import { render, screen } from "@testing-library/react";
import RootLayout, { metadata } from "../app/layout";

describe("RootLayout", () => {
  it("should render metadata successfully", () => {
    expect(metadata.title).toBe("Proxygen — Intelligence Command Center");
    expect(metadata.description).toBeDefined();
    expect(metadata.keywords).toContain("proxygen");
    expect(metadata.icons).toBeDefined();
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.twitter).toBeDefined();
  });

  it("should render children inside the layout structure", () => {
    render(
      <RootLayout>
        <div data-testid="child-element">Test Child Content</div>
      </RootLayout>
    );

    const child = screen.getByTestId("child-element");
    expect(child).toBeTruthy();
    expect(child.textContent).toBe("Test Child Content");
  });
});
