import { test, expect } from "@playwright/test";
import { faker } from '@faker-js/faker';

test.beforeEach(async ({ page }) => {
    page.goto('/')
    await page.waitForResponse('https://petclinic-api.bondaracademy.com/petclinic/api/seed')

})

test('TC1: Validation of delete specialty', async ({ page, request }) => {
    //1. Using API request, create a new specialty with the name "api testing expert".
    const newSpecialtyResponse = await request.post('https://petclinic-api.bondaracademy.com/petclinic/api/specialties', {
        data: {
            "name": "api testing expert"
        }
    })

    // Add assertion of the response status code
    expect(newSpecialtyResponse.status()).toEqual(201)

    //2. Navigate to the Specialties page
    await page.getByRole('link', { name: 'Specialties' }).click()

    //3. Add the assertion that the specialty "api testing expert" is displayed in the list of specialties
    await expect(page.getByRole('row', { name: 'api testing expert' })).toBeVisible()

    //4. Click the "Delete" button for the "api testing expert" specialty
    await page.getByRole('row', { name: 'api testing expert' }).getByRole('button', { name: 'Delete' }).click()

    //5. Add an assertion that the specialty "api testing expert" is deleted from the list of specialties
    await expect(page.getByRole('row', { name: 'api testing expert' })).not.toBeVisible()

})

test('TC2: Add and delete veterinarian', async ({ page, request }) => {
    // 1. Using API, create a new Veterinarian without the specialties assigned. Save the veterinarian ID from the response to the constant for later use.
    const veterinarianFirstName = faker.person.firstName()
    const veterinarianLastName = faker.person.lastName()
    const newVeterinarianResponse = await request.post('https://petclinic-api.bondaracademy.com/petclinic/api/vets', {
        data: {
            "firstName": veterinarianFirstName,
            "lastName": veterinarianLastName,
            "id": null,
            "specialties": []
        }
    })
    const newVeterinarianResponseJSON = await newVeterinarianResponse.json()
    const veterinarianId = newVeterinarianResponseJSON.id

    // Add assertion of the response status code and name of the veterinarian
    expect(newVeterinarianResponse.status()).toBe(201)
    expect(newVeterinarianResponseJSON.firstName).toBe(veterinarianFirstName)
    expect(newVeterinarianResponseJSON.lastName).toBe(veterinarianLastName)

    //2. Navigate to the Veterinarians page
    await page.getByRole('button', { name: ' Veterinarians' }).click()
    await page.getByRole('link', { name: 'All' }).click()

    //3. Add the assertion that newly created veterinarian is available in the list, and it does not have specialties assigned
    const newVeterinarianRow = page.getByRole('row', { name: `${veterinarianFirstName} ${veterinarianLastName}` })
    await expect(newVeterinarianRow).toBeVisible()
    await expect((newVeterinarianRow).locator('td').nth(1)).toBeEmpty()

    //4. Click the "Edit Vet" button for the newly created veterinarian
    await newVeterinarianRow.getByRole('button', { name: 'Edit Vet' }).click()

    //5. On "Edit Veterinarian" page, select "dentistry" specialty from the drop-down, and click the Save Vet button
    await page.locator('.dropdown-display').click()
    await page.getByRole('checkbox', { name: 'dentistry' }).check()
    await page.locator('.dropdown-display').click()
    await page.getByRole('button', { name: 'Save Vet' }).click()

    //6. Add the assertion that the "dentistry" specialty is displayed for the test veterinarian
    await expect((newVeterinarianRow).locator('td').nth(1)).toHaveText('dentistry')

    //7. Using API request, delete the created test veterinarian. Add assertion of response status code. (Tip: use the ID from the step 1)
    const deletedVeterinarianResponse = await request.delete(`https://petclinic-api.bondaracademy.com/petclinic/api/vets/${veterinarianId}`
    )
    expect(deletedVeterinarianResponse.status()).toBe(204)

    //8. Using API request, get the list of veterinarians. Make the assertion that the deleted veterinarian does not exist in the response body
    const veterinariansListResponse = await request.get('https://petclinic-api.bondaracademy.com/petclinic/api/vets')
    const veterinariansListResponseJSON = await veterinariansListResponse.json()

    veterinariansListResponseJSON.forEach(({ firstName, lastName }: { firstName: String; lastName: string }) => {
        expect(firstName).not.toBe(veterinarianFirstName)
        expect(lastName).not.toBe(veterinarianLastName)
    })

})

test('TC3: New specialty is displayed', async ({ page, request }) => {
    //1. Using API request, create a new specialty with the name "api testing ninja". 
    const newSpecialtyResponse = await request.post('https://petclinic-api.bondaracademy.com/petclinic/api/specialties', {
        data: {
            "name": "api testing ninja"
        }
    })
    const newSpecialtyResponseJSON = await newSpecialtyResponse.json()
    const specialtyId = newSpecialtyResponseJSON.id

    // Add assertion of the response status code
    expect(newSpecialtyResponse.status()).toEqual(201)

    //2. Using API request, create a new veterinarian with a specialty "surgery". 
    const veterinarianFirstName = faker.person.firstName()
    const veterinarianLastName = faker.person.lastName()
    const newVeterinarianResponse = await request.post('https://petclinic-api.bondaracademy.com/petclinic/api/vets', {
        data: {
            "firstName": veterinarianFirstName,
            "lastName": veterinarianLastName,
            "id": null,
            "specialties": [{ id: 3043, name: "surgery" }]
        }
    })
    const newVeterinarianResponseJSON = await newVeterinarianResponse.json()
    const veterinarianId = newVeterinarianResponseJSON.id

    //Add assertion of the response status code.
    expect(newVeterinarianResponse.status()).toBe(201)

    //3. Navigate to the Veterinarians page
    await page.getByRole('button', { name: ' Veterinarians' }).click()
    await page.getByRole('link', { name: 'All' }).click()

    //4. Add the assertion that newly created veterinarian is available in the list and it has specialty "surgery"
    const newVeterinarianRow = page.getByRole('row', { name: `${veterinarianFirstName} ${veterinarianLastName}` })
    await expect(newVeterinarianRow).toBeVisible()
    await expect((newVeterinarianRow).locator('td').nth(1)).toHaveText('surgery')

    //5. Click on the "Edit Vet" button
    await newVeterinarianRow.getByRole('button', { name: 'Edit Vet' }).click()

    //6. On Edit Veterinarian page, change the specialty from "surgery" to "api testing ninja" and click "Save Vet" button
    await page.locator('.dropdown-display').click()
    await page.getByRole('checkbox', { name: 'surgery' }).uncheck()
    await page.getByRole('checkbox', { name: 'api testing ninja' }).check()
    await page.locator('.dropdown-display').click()
    await page.getByRole('button', { name: 'Save Vet' }).click()

    //7. Add the assertion that the veterinarian has a specialty "api testing ninja"
    await expect((newVeterinarianRow).locator('td').nth(1)).toHaveText('api testing ninja')

    //8. Using an API request, delete the created test veterinarian. Add assertion of the response status code
    const deletedVeterinarianResponse = await request.delete(`https://petclinic-api.bondaracademy.com/petclinic/api/vets/${veterinarianId}`)
    expect(deletedVeterinarianResponse.status()).toBe(204)

    //9. Using API request, delete the specialty "api testing ninja". Add assertion of the response status code
    const deletedSpecialtyResponse = await request.delete(`https://petclinic-api.bondaracademy.com/petclinic/api/specialties/${specialtyId}`)
    expect(deletedSpecialtyResponse.status()).toBe(204)

    //10. Navigate to the Specialties page and add an assertion that "api testing ninja" does not exist in the list of specialties
    await page.getByRole('link', { name: 'Specialties' }).click()
    await expect(page.getByRole('row', { name: 'api testing expert' })).not.toBeVisible()

})
