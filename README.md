This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```


For Prof Johnson to run

To start nextjs app
npm run dev

For Flask Server
open app.py
Click Run -> Start Debugging -> Select a debug configuration -> Flask

once both are running, navigate to localhost:3000

Best way to test is to open 2 browsers with 2 different google accounts
sign up with both
Should see a chatroom with previous messages

In bottom right you can select who to send a message to
If other account not showing up, refresh to give db time to update

By checking that account and typing a message, should see that show up on other window
On your window, will not see the message but a placeholder

If neither the sender or receiver, you will see a different message

Refreshing the page will display the raw encrypted messages of all previous messages before opening the page