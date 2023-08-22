# Game Fuse Javascript
Use Game Fuse Javascript in your JS Game project to easily add authenticaion, user data, leaderboards, in game stores and more all without writing and hosting any servers, or writing any API code. Its never been easier to store your data online! Game Fuse is always free for hobby and small indie projects. With larger usage there are metered usage fees.

## Getting Started
The first step of integrating GameFuse with your project, is to make an account at https://www.gamefuse.co.
After creating your account, add your first game and note the ID and API Token.
With this setup, you can now connect via your game client. 

### PixiJs, BabylonJs, etc
If your game engine has an editable HTML file, you can paste the following in the <head> tag of the HTML document:
```
<script src="https://cdn.jsdelivr.net/gh/game-fuse/game-fuse-js@main/gameFuseFull.min.js"></script>
```

### Playcanvas
Playcanvas has a different method, in your scene, go to the settings wheel on the top bar, then click on "external scripts" on the left panel that is opened, then paste the following in a new enty: "https://cdn.jsdelivr.net/gh/game-fuse/game-fuse-js@main/gameFuseFull.min.js". This effectivly does the same thing as the prior method on build. If you would like to see an example in action, check out https://playcanvas.com/editor/scene/1799045


## Connecting to Game Fuse

The first step in using GameFuse after it is installed and your account is regestered is to run the SetUpGame function. After this step you can run other functions to register users, sign in users, read and write game data.

In any script on your first scene you can run:

```

start () {
    var gameID = 'Your Game ID Here';
    var gameToken 'your Game Token Here';

    # 3rd param is the function below, GameFuse will call this function when it is done connecting your game
    let self = this;
    GameFuse.setUpGame(gameID, gameToken, function(message,hasError){self.gameSetUp(message,hasError)}, true);
}



gameSetUp(message, hasError) {
    if (hasError)
    {
        console.log("Error connecting game: "+message);
    }
    else
    {
        console.log("Game Connected Successfully")
        foreach (GameFuseStoreItem storeItem in GameFuse.GetStoreItems())
        {
            console.log(storeItem.GetName() + ": " + storeItem.GetCost());
        }
    }
}

```

After completion of this GameFuse function, for this code example, we print out names and costs of all the store items in your virtual store. This prooves the initial sync worked. Note this will only print out store items if you added some on your GameFuse dashboard.

## Signing game users up

Enable users to sign up in your JS game with the following code. They will be saved on your GameFuse Game and can then login from other devices since the data is saved online.
Add a method on a script on your sign up scene after you have collected your inputted username and password. Maybe this is on a a button function for a 'submit' or 'register' button.
Username is mandatory but it is just for display. Later sign in attempts will use email not username

```
#Feed in your users email, username and password here
signUp (email, password, password_confirmation, username) {
	#5th parameter is the callback when execution is complete
    let self = this;
  	GameFuse.signUp(this.userEmail, "password", "password", this.username, function(message,hasError){self.signedUp(message,hasError)});
}

signedUp(message, hasError) {
  	if (hasError)
  	{
    	console.log("Error signign up: "+message);
  	}
  	else
  	{
    	console.log("Signed Up: " + GameFuseUser.CurrentUser.GetName());
  	}
}
```

## Signing game users in


Signing In Follows the same protocal as signing up, just with different parateters. As always, there is a callback function to let you know your sign in has been successful or not.
Email and password (not username), will be used to sign in

```
#Feed in your users email and password here
signIn (email, password, SignedIn) {
	#3rd parameter is the callback when execution is complete
    let self = this;
  	GameFuse.signIn(this.userEmail, "password", function(message,hasError){self.signedIn(message,hasError)});
}

signedIn(message, hasError) {
  	if (hasError)
  	{
      	console.log("Error signign in: "+message);
  	}
  	else
  	{
      	console.log("Logged In: " + GameFuseUser.CurrentUser.GetName());
      	console.log("Current Credits: " + GameFuseUser.CurrentUser.GetCredits());
  	}
}
```

## Creating store items on the web

To create store items on the web, navigate to your GameFuse.co home page, and sign in if you are not already
You can click on your Game on the homepage you want to add items for. On this page if you scroll down to the Store Items section, you will see + STORE ITEM button, here you can add in Name, Cost, Description, and Category. All are mandatory but do not need to used in your game. The store feature does not integrate real payment systems, this is for items you want your users to be able to "unlock" with in-game-currency or with achievements in the game. How you configure that is up to you.

## Using the store in your game

Store Items Library are downloaded upon SignIn() and SignUp(), The Items will be refreshed every time the user signs in or signs up again.
To access store items and attributes by calling  the following code. This doesnt sync them with the available items on the server, it is simply showing you the results downloaded on sign in or sign up.

```
for (const storeItem of GameFuse.getStoreItems()) {
    console.log(storeItem.GetName());  //FireBow
    console.log(storeItem.GetCategory()); //BowAndArrows
    console.log(storeItem.GetId()); //12
    console.log(storeItem.GetDescription());  //A bow and arrow item that shoots fire arrows
    console.log(storeItem.GetCost()); // 500 (credits)
}
```

To access purchased store items by your current logged in user call the following. Because these are downloaded on login, there is no callback for this! It is already available!
This will throw an error if you are not signed in already

```
const items = GameFuseUser.CurrentUser.getPurchasedStoreItems();
```

To Purchase a store item simply call the code below.
Because this function talks to the server, it will require a callback. If the user doesnt have enough credits on their account (see next section), the purchase will fail
This function will refresh the GameFuseUser.CurrentUser.purchasedStoreItems List with the new item

```
PurchaseItem(store_item){
  let self = this;
  console.log(GameFuseUser.CurrentUser.getPurchasedStoreItems().length); // Prints 0
  GameFuseUser.PurchaseStoreItem(GameFuse.GetStoreItems().First, function(message,hasError){self.PurchasedItemCallback(message,hasError)})
}

PurchasedItemCallback(message, hasError) {
  if (hasError)
  {
      console.log("Error purchasing item: "+message);
  }
  else
  {
      console.log("Purchased Item");
      console.log(GameFuseUser.CurrentUser.getPurchasedStoreItems().length); // Prints 1
  }
}
```


## Using Credits


Credits are a numeric attribute of each game user. It is a simple integer value.
You can add them manually and they are detracted automatically upon store item purchases
Below is a script to demonstrate the full lifecycle of credits on a signed in user. First it prints the credits your signed in user has, then prints the cost of the first store item, then it adds credits to your user. Because this syncs with the server, it requires a callback. Upon success, you will see the user now has more credits when logged. At this point in time you can then run the purchase store item function successfully.

```
Start(){
    let self = this;
    console.log(GameFuseUser.CurrentUser.getCredits());  // Prints 0
    console.log(GameFuse.getStoreItems()[0].cost) // Prints 25 (or whatever you set your first item to on the web dashboard)
    GameFuseUser.CurrentUser.AddCredits(50, function(message,hasError){self.AddCreditsCallback(message,hasError)});
}

AddCreditsCallback(message, hasError)
{
    if (hasError)
    {
        console.log("Error adding credits: " + message);
    }
    else
    {
      let self = this;
      console.log(GameFuseUser.CurrentUser.getCredits();  // Prints 50
      GameFuseUser.PurchaseStoreItem(GameFuse.GetStoreItems()[0], function(message,hasError){self.PurchasedItemCallback(message,hasError)})

    }

}

PurchasedItemCallback(message, hasError) {
  if (hasError)
  {
      console.log("Error purchasing item: "+message);
  }
  else
  {
      console.log("Purchased Item");
      console.log("Current Credits: " + GameFuseUser.CurrentUser.GetCredits());
  }
}

```
## Custom user data


Custom user data or Key Value pairs are a simple way to save any kind of data for a particular user.
Some examples might be {"world_2_unlocked":"true"}, {"player_color","red"}, {"favorite_food","Onion"}
These are downloaded to your system upon login, and synced when one is updated. You can access with GameFuseUser.CurrentUser.attributes

All values and keys must be strings. If you want to use other data structures like arrays, you could stringify the array on save, and convert the saved string to an array on load.

```
Start(){
    let self = this;
    console.log(GameFuseUser.CurrentUser.attributes.length);  // Prints 0
    console.log(GameFuseUser.CurrentUser.GetAttributeValue("CURRENT_LEVEL") == null); // Prints true
    GameFuseUser.CurrentUser.SetAttribute("CURRENT_LEVEL", "5", function(message,hasError){self.SetAttributeCallback(message,hasError)});
}

SetAttributeCallback(message, hasError) {
  if (hasError)
  {
      console.log("Error setting attribute: "+message);
  }
  else
  {
      console.log(GameFuseUser.CurrentUser.GetAttributeValue("CURRENT_LEVEL")); // Prints "5"
  }
}
```

## In game leaderboard

Leaderboards can be easily created within GameFuse
From the JS game client, a Leaderboard Entry can be added with a leaderboard_name, score, and extra_attributes (metadata) for the current signed in user
Leaderboards can be downloaded for a specific leaderboard_name, which would gather all the high scores in order for all users in the game or
Leaderboards can be downloaded for a specific user, so that you can download the current users leaderboard data for all leaderboard_names
The below example shows submitting 2 leaderboard entries, then retrieving them for the game, and for the current user


```
Start(){
  let self = this
  var extraAttributes = {};
  extraAttributes["deaths"] =  "15";
  extraAttributes["Jewels"] =  "12";
  GameFuseUser.CurrentUser.AddLeaderboardEntry("Game1Leaderboard",10, extraAttributes, function(message,hasError){self.LeaderboardEntryAdded(message,hasError)});
}

LeaderboardEntryAdded(message, hasError)
{
    let self = this;
    if (hasError)
    {
        print("Error adding leaderboard entry: " + message);
    }
    else
    {

        print("Set Leaderboard Entry 2");
        var extraAttributes = {};
        extraAttributes.["deaths"] = "25";
        extraAttributes.["Jewels"] = "15";

        GameFuseUser.CurrentUser.AddLeaderboardEntry("Game1Leaderboard", 7, extraAttributes, function(message,hasError){self.LeaderboardEntryAdded2(message,hasError)});

    }
}

LeaderboardEntryAdded2(message, hasError)
{
    let self = this;
    if (hasError)
    {
        print("Error adding leaderboard entry 2: " + message);
    }
    else
    {
        print("Set Leaderboard Entry 2");
        GameFuseUser.CurrentUser.GetLeaderboard(5, true, function(message,hasError){self.LeaderboardEntriesRetrieved(message,hasError)});
    }
}

LeaderboardEntriesRetrieved(message, hasError)
{
    if (hasError)
    {
        print("Error loading leaderboard entries: " + message);
    }
    else
    {
        let self = this;
        print("Got leaderboard entries for specific user!");
        for (const entry of GameFuse.Instance.leaderboardEntries) {
            console.log(entry.getUsername() + ": " + entry.getScore().toString() + ": " + entry.getLeaderboardName());
            const extraAttributes = entry.getExtraAttributes();
            for (const key in extraAttributes) { 
                console.log(key + ": " + extraAttributes[key]); 
            }

        }
        GameFuse.Instance.GetLeaderboard(5, true, "Game1Leaderboard", function(message,hasError){self.LeaderboardEntriesRetrievedAll(message,hasError)});

    }
}

LeaderboardEntriesRetrievedAll(message, hasError)
{
    if (hasError)
    {
        print("Error loading leaderboard entries: " + message);
    }
    else
    {
        let self = this;
        print("Got leaderboard entries for whole game!");
        for (const entry of GameFuse.Instance.leaderboardEntries) {
            console.log(entry.getUsername() + ": " + entry.getScore().toString() + ": " + entry.getLeaderboardName());
            const extraAttributes = entry.getExtraAttributes();
            for (const key in extraAttributes) { 
                console.log(key + ": " + extraAttributes[key]); 
            }

        }

    }
}
```

You can also clear all leaderboard entries for a particular leaderboard_name for the current user like this:

```
Start(){
  let self = this;
  var extraAttributes = {};
  extraAttributes["deaths"] = "15";
  extraAttributes["Jewels"] = "12";
  GameFuseUser.CurrentUser.AddLeaderboardEntry("Game2Leaderboard",10, extraAttributes, function(message,hasError){self.LeaderboardEntryAdded(message,hasError)});
}

LeaderboardEntryAdded(message, hasError)
{
    let self = this;
    if (hasError)
    {
        print("Error adding leaderboard entry: " + message);
    }
    else
    {
        print("Clear Leaderboard Entry 2");
        GameFuseUser.CurrentUser.ClearLeaderboardEntries("Game2Leaderboard", function(message,hasError){self.LeaderboardEntryCleared(message,hasError)});
    }
}

LeaderboardEntryCleared(message, hasError)
{
    if (hasError)
    {
        print("Error adding leaderboard entry: " + message);
    }
    else
    {
        print("User will no longer have leaderboard entries for 'Game2Leaderboard'");

    }
}
```


## Class Methods

Check each model below for a list of methods and attributes.

```
###GameFuseUser.js
your current signed in user can be retrieved with:
gameFuseUser user = GameFuse.CurrentUser;

isSignedIn();
getNumberOfLogins();
getLastLogin();
getUsername();
getScore();
getCredits();

addCredits(int credits, Action < string, bool > callback = null);
setCredits(int credits, Action < string, bool > callback = null);
addScore(int credits, Action < string, bool > callback = null);
setScore(int score, Action < string, bool > callback = null);
getAttributes();
getAttributesKeys();
getAttributeValue(string key);
setAttribute(string key, string value, Action < string, bool > callback = null);
removeAttribute(string key, Action < string, bool > callback = null);
getPurchasedStoreItems();
purchaseStoreItem(GameFuseStoreItem storeItem, Action < string, bool > callback = null);
purchaseStoreItem(int storeItemId, Action < string, bool > callback = null);
removeStoreItem(int storeItemID, bool reimburseUser, Action < string, bool > callback = null);
removeStoreItem(GameFuseStoreItem storeItem, bool reimburseUser, Action < string, bool > callback = null);
addLeaderboardEntry(string leaderboardName, int score, Dictionary extraAttributes = null, Action < string, bool > callback = null);
addLeaderboardEntry(string leaderboardName, int score, Action < string, bool > callback = null);
getLeaderboard(int limit, bool onePerUser, Action < string, bool > callback = null); //Get all leaderboard entries for current signed in user


###GameFuse.js
setUpGame(string gameId, string token, Action < string, bool > callback = null);
getGameId();
getGameName();
getGameDescription();
getStoreItems() //Gets all store items (your library)
signIn(string email, string password, Action < string, bool > callback = null);
signUp(string email, string password, string password_confirmation, string username, Action < string, bool > callback = null);
getLeaderboard(int limit, bool onePerUser, string LeaderboardName, Action < string, bool > callback = null); //Retrieves leaderboard for one specific Leaderboard Name


###GameFuseStoreItem.js
getName();
getCategory();
getDescription();
getCost();
getId();

###GameFuseLeaderboardEntry.js
getUsername();
getScore();
getLeaderboardName();
getExtraAttributes();
```