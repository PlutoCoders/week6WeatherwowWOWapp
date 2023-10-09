let itemsToComplete = document.querySelectorAll(`itemToComplete`)
console.log({itemsToComplete})

// For Each Loop
itemsToComplete.foreacj((item, itemIndex) => {
    itemButton.addEventListener(`click`, event => {
        console.log(event);
    })
})