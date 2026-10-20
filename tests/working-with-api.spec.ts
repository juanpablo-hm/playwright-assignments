import { test, expect } from "@playwright/test";
import owners from "../test-data/owners.json";
import expectedSpecialties from "../test-data/specialties.json"

test.beforeEach(async ({ page }) => {
  //All Owners
  await page.route("*/**/api/owners", async (route) => {
    await route.fulfill({ json: owners });
  });

  //Owner Details
  await page.route("*/**/api/owners/*", async (route) => {
    await route.fulfill({ json: owners[0] });
  });

  //All Veterinarians Page
  await page.route("*/**/api/vets", async (route) => {
    const response = await route.fetch()
    const responseJSON = await response.json()
    responseJSON.find((vet: any) => vet.lastName === 'Jenkins').specialties = expectedSpecialties
    await route.fulfill({
      json: responseJSON
    })
  });

  //Selected Veterinarian Details
  await page.route("*/**/api/vets/*", async (route) => {
    const response = await route.fetch()
    const responseJSON = await response.json()
    responseJSON.specialties = expectedSpecialties
    await route.fulfill({
      json: responseJSON
    })
  });

  await page.goto("/");

});

test("Mocking API request: Validate owners list and visit list count", async ({ page }) => {
  //1. Navigate to the Owners page.
  await page.getByRole("button", { name: "OWNERS" }).click();
  await page.getByRole("link", { name: "SEARCH" }).click();

  /*The first owner should have 2 pets,
    the second owner should have 5 pets (names of pets should be displayed in the pets column)*/

  const firstOwnerFullName = `${owners[0].firstName} ${owners[0].lastName}`;
  await expect(page.getByRole("link", { name: firstOwnerFullName })).toBeVisible();
  await expect(page.getByRole("row", { name: firstOwnerFullName }).locator("td").nth(4)).toHaveText(`${owners[0].pets[0].name} ${owners[0].pets[1].name}`);

  const secondOwnerFullName = `${owners[1].firstName} ${owners[1].lastName}`;
  await expect(page.getByRole("link", { name: secondOwnerFullName })).toBeVisible();
  await expect(page.getByRole("row", { name: secondOwnerFullName }).locator("td").nth(4)).toHaveText(`${owners[1].pets[0].name} ${owners[1].pets[1].name} ${owners[1].pets[2].name} ${owners[1].pets[3].name} ${owners[1].pets[4].name}`);

  //2. Add the assertion that the length of the Owners list should be 2
  await expect(page.locator(".ownerFullName")).toHaveCount(2);

  //3. Select the first owner. The owner information page should open.
  await page.getByRole("link", { name: firstOwnerFullName }).click();
  await expect(page.getByRole("heading").first()).toHaveText("Owner Information");

  //4. Owner details should match the information from the Owners page. Add the assertions accordingly
  await expect(page.getByRole("row", { name: "Name" }).first().locator(".ownerFullName")).toHaveText(firstOwnerFullName);
  await expect(page.getByRole("row", { name: "Address" }).locator("td")).toHaveText(owners[0].address);
  await expect(page.getByRole("row", { name: "City" }).locator("td")).toHaveText(owners[0].city);
  await expect(page.getByRole("row", { name: "Telephone" }).locator("td")).toHaveText(owners[0].telephone);

  //5. Add the assertions that the Owner Information page has two pets and their names match the names from the Owners page
  await expect(page.locator("app-pet-list")).toHaveCount(2);
  await expect(page.locator("app-pet-list", { hasText: "Name" }).first().locator("dd").first()).toContainText(owners[0].pets[0].name);
  await expect(page.locator("app-pet-list", { hasText: "Name" }).nth(1).locator("dd").first()).toContainText(owners[0].pets[1].name);

  //6. The first pet should have a history of 10 visits displayed on the Owner Information page
  //7. Add the assertion that the length of the list with visits is 10
  await expect(page.locator("app-pet-list", { hasText: owners[0].pets[0].name }).locator("app-visit-list  table>tr")).toHaveCount(10);
});

test('Intercepting API Response: Validate specialties list for veterinarian', async ({ page }) => {

  //1. Navigate to the Veterinarians page. Intercept the API response for the "vets" endpoint. 
  await page.getByRole('button', { name: "VETERINARIANS" }).click()
  await page.getByRole('link', { name: "ALL" }).click()

  //2. For the current response, "Sharon Jenkins" does not have any specialties. Modify the response by adding 10 specialties for this vet
  await expect(page.getByRole('row', { name: "Sharon Jenkins" }).locator('td div')).toHaveCount(10)

  //3. Add an assertion that the 10 specialties added are displayed on the page for "Sharon Jenkins"
  await page.getByRole('row', { name: "Sharon Jenkins" }).getByRole('button', { name: "Edit Vet" }).click()

  const dropdownText = await page.locator('.selected-specialties').innerText()
  const selectedSpecialties = dropdownText.split(',').map(s => s.trim())
  expect(selectedSpecialties).toHaveLength(10)

})
