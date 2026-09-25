import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto("/")

  //1. Select the OWNERS menu item in the navigation bar and then select "Search" from the drop-down menu
  await page.getByRole('button', { name: "OWNERS" }).click()
  await page.getByRole('link', { name: "SEARCH" }).click()

});

test.describe("Datepickers", () => {

  test("TC1: Select the desired date in the calendar", async ({ page }) => {
    
    //2. In the list of the Owners, locate the owner by the name "Harold Davis" and select this owner
    await expect(page.getByRole('link', {name: "Harold Davis"})).toBeVisible()
    await page.getByRole('link', {name: "Harold Davis"}).click()

    //3. On the Owner Information page, select the "Add New Pet" button
    await page.getByRole('button', {name: "Add New Pet"}).click()

    //4. In the Name field, type any new pet name, for example, "Tom"
    await page.getByRole('textbox', {name: "Name"}).fill('Manny')

    //5. Add the assertion of icon in the input field, that it changed from "X" to "V"
    await expect(page.locator('#name ~ span')).toHaveClass(/glyphicon-ok\b/)

    //6. Click on the calendar icon for the "Birth Date" field
    await page.getByLabel('Open calendar').click()

    //7. Using the calendar selector, select the date "May 2nd, 2014"
    const birthYear = '2014'
    const birthMonth = '05'
    const birthDay = '02'

    let currentMonthAndYear = await page.getByLabel('Choose month and year').textContent()
    if(currentMonthAndYear !== `${birthMonth} ${birthYear}`){
      await page.getByLabel('Choose month and year').click()  
     
      let yearsList = (await page.locator('.mat-calendar-body-cell').allTextContents()).map(t => t.trim())
      while(!yearsList?.includes(birthYear)){
        await page.getByLabel('Previous 24 years').click()
        yearsList = (await page.locator('.mat-calendar-body-cell').allTextContents()).map(t => t.trim())
      } 

       await page.getByRole('button', {name: birthYear }).click()
       await page.getByRole('button', {name: `${birthMonth} ${birthYear}`}).click()  
    }
     
    await page.getByRole('button', {name:`${birthYear}/${birthMonth}/${birthDay}`}).click()

    //8. Add the assertion of the input field is in the format "2014/05/02"
    await expect(page.locator('input[name="birthDate"]')).toHaveValue(`${birthYear}/${birthMonth}/${birthDay}`)

    //9. Select the type of pet "dog" and click "Save Pet" button
    await page.locator('[name="pettype"]').selectOption('dog')
    await page.getByRole('button', {name:'Save Pet'}).click()

    //10. On the Owner Information page, add assertions for the newly created pet. Name is Tom, Birth Date is in the format "2014-05-02", Type is dog
    const newPetTable = page.locator('app-pet-list').filter({ hasText: 'Manny' })
    await expect(newPetTable.locator('dt:has-text("Name") + dd')).toHaveText('Manny')
    await expect(newPetTable.locator('dt:has-text("Birth Date") + dd')).toHaveText(`${birthYear}-${birthMonth}-${birthDay}`)
    await expect(newPetTable.locator('dt:has-text("Type") + dd')).toHaveText('dog')

    //11. Click the "Delete Pet" button for the new pet "Tom"
    await newPetTable.getByRole('button', { name: 'Delete Pet' }).click()

    //12. Add an assertion that Tom does not exist in the list of pets anymore
    await expect(page.locator('app-pet-list').filter({ hasText: 'Manny' })).not.toBeVisible()

  });

  test("TC2: Select the dates of visits and validate dates order.", async ({ page }) => {

    //2. In the list of the Owners, locate the owner by the name "Jean Coleman" and select this owner
    await expect(page.getByRole('link', {name: "Jean Coleman"})).toBeVisible()
    await page.getByRole('link', {name: "Jean Coleman"}).click()

    //3. In the list of pets, locate the pet with a name "Samantha" and click "Add Visit" button
     page.locator('app-pet-list').filter({ hasText: 'Samantha' }).getByRole('button', { name: 'Add Visit' }).click()

    //4. Add the assertion that "New Visit" is displayed as the header of the page
    await expect(page.getByRole('heading', {name:'New Visit'})).toBeVisible()

    //5. Add the assertion that the pet name is "Samantha" and owner's name is "Jean Coleman"
    await expect(page.getByRole('cell', {name: 'Samantha'})).toBeVisible()
    await expect(page.getByRole('cell', {name: 'Jean Colema'})).toBeVisible()

    //6. Click on the calendar icon and select the current date in date picker
    await page.getByLabel('Open calendar').click()
    
    const date = new Date()
    let todaysDate = `${date.getFullYear()}/${date.toLocaleDateString('en-US', { month: '2-digit' })}/${date.toLocaleDateString('en-US', { day: '2-digit' })}`
    await page.getByRole('button', { name: todaysDate}).click()

    //7. Add an assertion that the selected date is displayed and it is in the format "YYYY/MM/DD"
    await expect(page.locator('input[name="date"]')).toHaveValue(todaysDate);

    //8. Type the description in the field, for example, "dermatologists visit" and click "Add Visit" button
    await page.locator('#description').fill('Dermatologists visit')
    await page.getByRole('button', {name:'Add Visit'}).click()

    //9. Add an assertion that the selected date of visit is displayed at the top of the list of visits for "Samantha" pet on the "Owner Information" page and is in the format "YYYY-MM-DD"
    const samanthaVisitsTable = page.locator('app-pet-list').filter({ hasText: 'Samantha' }).locator('app-visit-list')
    await expect(samanthaVisitsTable.locator('td').first())
    .toHaveText(`${date.getFullYear()}-${date.toLocaleDateString('en-US', { month: '2-digit' })}-${date.toLocaleDateString('en-US', { day: '2-digit' })}`)

    //10. Add one more visit for "Samantha" pet by clicking "Add Visit" button
    page.locator('app-pet-list').filter({ hasText: 'Samantha' }).getByRole('button', { name: 'Add Visit' }).click()

    //11. Click on the calendar icon and select the date which is 45 days back from the current date
    await page.getByLabel('Open calendar').click()

    date.setDate(date.getDate() - 45)
    const expectedDay = date.getDate().toString()
    const expectedMonth = date.toLocaleString('en-US', { month: '2-digit' })
    const expectedYear = date.getFullYear()

    let currentMonthAndYear = await page.getByLabel('Choose month and year').textContent()

    while(currentMonthAndYear !== `${expectedMonth} ${expectedYear}`){
      await page.getByRole('button', {name:'Previous month'}).click()  
      currentMonthAndYear = await page.getByLabel('Choose month and year').textContent()
    }

    await page.getByRole('button', {name:`${expectedYear}/${expectedMonth}/${expectedDay}`}).click()

    //12. Type the description in the field, for example, "massage therapy" and click "Add Visit" button
    await page.locator('#description').fill('Therapy Visit')
    await page.getByRole('button', {name:'Add Visit'}).click()

    //13. Add the assertion that the date added at step 11 is in chronological order in relation to the previous dates for "Samantha" pet on the "Owner Information" page. The date of visit above this date in the table should be greater.
    const lastVisitDateData= await samanthaVisitsTable.locator('tr td').first().textContent()
    const secondToLastVisitDateData = await samanthaVisitsTable.locator('tr').nth(2).locator('td').first().textContent()
    
    const lastVisitDate = Date.parse(`${lastVisitDateData}`)
    const secondToLastVisitDate = Date.parse(`${secondToLastVisitDateData}`)

    expect(lastVisitDate).toBeGreaterThan(secondToLastVisitDate)
   
    //14. Select the "Delete Visit" button for both newly created visits
    await samanthaVisitsTable.getByRole('row', {name: lastVisitDateData ?? ''}).getByRole('button', {name: 'Delete Visit'}).click()
    await samanthaVisitsTable.getByRole('row', {name: secondToLastVisitDateData ?? ''}).getByRole('button', {name: 'Delete Visit'}).click()

    //15. Add the assertion that deleted visits are no longer displayed in the table on "Owner Information" page
    await expect(samanthaVisitsTable.getByRole('row', {name: lastVisitDateData ?? ''}).locator('td:has-text("Dermatologists visit")')).not.toBeVisible()
    await expect(samanthaVisitsTable.getByRole('row', {name: secondToLastVisitDateData ?? ''}).locator('td:has-text("Therapy Visit")')).not.toBeVisible()

  });
  
});
