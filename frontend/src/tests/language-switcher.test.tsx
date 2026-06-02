import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslation } from "react-i18next";
import { describe, expect, it } from "vitest";

import LanguageSwitcher from "../components/LanguageSwitcher";
import { renderWithProviders } from "./test-utils";

function Harness() {
  const { t } = useTranslation();
  return (
    <div>
      <LanguageSwitcher />
      <p>{t("osteorisk.actions.calculate")}</p>
    </div>
  );
}

describe("LanguageSwitcher", () => {
  it("changes visible UI text without page reload", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    expect(screen.getByText("Рассчитать риск")).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Язык" }), "en");

    expect(await screen.findByText("Calculate risk")).toBeInTheDocument();
  });
});
