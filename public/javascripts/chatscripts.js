let sendChat = document.getElementById('send-text')
let sendUsername = document.getElementById('send-user')

sendChat.addEventListener('keyup', (event) => {
    if (event.key === 'Enter'){
        console.log(event)
        event.preventDefault()
        let sendBtn = document.getElementById('send-text-btn')
        let input = document.getElementById('send-text')
        input.value = input.value.slice(0, input.value.length - 1)   // fjerne \n i slutningen, no need.
        sendBtn.click()
    }
})

sendUsername.addEventListener('keyup', (event) => {
    if (event.key === 'Enter'){
        event.preventDefault()
        let sendBtn = document.getElementById('send-user-btn')
        let input = document.getElementById('send-user')
        console.log(input.value)
        input.value = input.value.slice(0, input.value.length - 1)
        sendBtn.click()
    }
})

function scrollBot(){
    let div = document.getElementById('receive-div')
    div.scrollTop = div.scrollHeight
}