Welcome to GameFuse!
This is the C# Unity code base
Add this to your Unity game for easy user sign up, login, metadata, in game store, and more
For full documentation Please check out gamefuse.co/docs


Get Started
1. Create a Free Account at gamefuse.co
2. See Next Section for custom accounts

How to set your game up with GameFuse
1. navigate to gamefuse.co
2. create your account, then create a 'game'
6. Import this code into your Asset folder in your Unity Application
4. Import the prefab "GameFuseInitializer" into your first scene
5. To connect, in a new script: GameFuse.SetUpGame(gameID, gameToken, ApplicationSetUp); where ApplicationSetUp is a callback function
  - void ApplicationSetUp(string message, bool hasError) {} should be the function to impliment on callback from connecting to your server
6. Once connected, you can use any function on gamefuse.co/docs to get and set the data for your user.
