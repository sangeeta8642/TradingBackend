require("./dbconnection")
const express = require("express");
const app = express();
const cors = require("cors");
const Users = require("./User-Schema");
const UserSchema = require("./User-Schema");
var request = require('request');
const { v4: uuidv4 } = require('uuid');
const data = require('./StockCompanies.json');
const CardData = require('./CardSchema');

const uuid = uuidv4();
app.use(cors());
app.use(express.json());

var MetaData = '';

// Dashboard Data
const metaDataArray = [
    {
        "CompanyName": "International Business Machines Corporation",
        "Information": "Daily Prices (open, high, low, close) and Volumes",
        "Symbol": "IBM",
        "LastRefreshed": "2024-05-10",
        "OutputSize": "Compact",
        "TimeZone": "US/Eastern"
    },
    {
        "CompanyName": "Microsoft Corporation",
        "Information": "Daily Prices (open, high, low, close) and Volumes",
        "Symbol": "MSFT",
        "LastRefreshed": "2024-05-14",
        "OutputSize": "Compact",
        "TimeZone": "US/Eastern"
    },
    {
        "CompanyName": "JPMorgan Chase & Co.",
        "Information": "Daily Prices (open, high, low, close) and Volumes",
        "Symbol": "JPM",
        "LastRefreshed": "2024-05-14",
        "OutputSize": "Compact",
        "TimeZone": "US/Eastern"
    },
];


// Creating Manual Data into dynamic
app.get('/DashData', async (req, res) => {
    try {
        const insertedData = await CardData.insertMany(metaDataArray);
        console.log(`${insertedData.length} documents inserted into MongoDB collection`);
        res.json(insertedData);
    } catch (err) {
        console.error('Error occurred while inserting documents into MongoDB collection:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Getting All Stocks
app.get('/GettingAllstocks', async (req, res) => {
    try {
        const stocks = await CardData.find({});
        res.json(stocks);
    } catch (err) {
        console.error('Error occurred while fetching data from MongoDB collection:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Getting user watchlists
app.get('/getWatchlists/:userId',async (req,res)=>{
    const userId=req.params.userId
    try{
        const user= await Users.findById(userId)
        if(!user){
            res.send("user not found")
        }else{
            res.json(user.WatchListCreate)
        }
    }catch(err){
        res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
})

//  getting all information about stock using their stock symbol
app.get('/GettingStocksData/:SymbolName', (req, res) => {

    var url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${req.params.SymbolName}&apikey=TQFQ6AYSC2TIBCLZ`;
    request.get({
        url: url,
        json: true,
        headers: { 'User-Agent': 'request' }
    }, (err, response, data) => {
        if (err) {
            res.status(500).send({ error: "internal server error" })
        } else if (response.statusCode !== 200) {
            res.status(response.statusCode).send({ error: "Error Fetching Data" })
        } else {
            res.send(data);
            if (data) {
                MetaData === data['Meta Data'];
            }
        }
    });
});

// getting the items from watchlist
app.get("/getItems/:userId/:watchlistname", async (req, res) => {
    try {
      const userId = req.params.userId;
      const watchlistname = req.params.watchlistname;
  
      const user = await Users.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      const watchlist = user.WatchListCreate.find(watchlist => watchlist.name=== watchlistname);
      if (!watchlist) {
        return res.status(404).json({ error: "Watchlist not found" });
      }
  
      // Return the items array of the watchlist
      res.status(200).json({ items: watchlist.items });
    } catch (error) {
      console.error("Error retrieving watchlist items:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  

// Watchlist Option - new watchlist ko create Kar na
app.post("/createInnerArray/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const { innerArrayName } = req.body;

        const user = await UserSchema.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.WatchListCreate.push({ name: innerArrayName, items: [] });
        await user.save();

        res.status(200).json({ message: "Inner array added successfully", user });
    } catch (error) {
        console.error("Error creating inner array:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Createwatchlist array ke under new watchlist option ke under data ko feed kar na
app.post("/addItemToInnerArray/:userId/:innerArrayId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const innerArrayId = req.params.innerArrayId;
        const dataToAdd = req.body;

        const user = await UserSchema.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const innerArrayItem = user.WatchListCreate.id(innerArrayId);
        if (!innerArrayItem) {
            return res.status(404).json({ error: "Inner array item not found" });
        }

        const itemToAdd = { id: uuid, ...dataToAdd };

        innerArrayItem.items.push(itemToAdd);
        await user.save();

        res.status(200).json({ message: "Data added to inner array item successfully", user });
    } catch (error) {
        console.error("Error adding data to inner array item:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// Particular Data Delete 
app.delete('/removeItem/:userId/:watchlistname/:itemsymbol', async (req, res) => {
    try {
      const userId = req.params.userId;
      const watchlistname = req.params.watchlistname;
      const itemsymbol = req.params.itemsymbol;
  
      const user = await UserSchema.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const watchlist = user.WatchListCreate.find(watchlist => watchlist.name.toString() === watchlistname);
      if (!watchlist) {
        return res.status(404).json({ message: 'Watchlist not found' });
      }

      const itemIndex = watchlist.items.findIndex(item => item.Symbol === itemsymbol);
      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item not found' });
      }
  
      watchlist.items.splice(itemIndex, 1);
      await user.save();
  
      return res.json(watchlist.items);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
});


// Delete Items contained Object watchlist ko delete kar na
app.delete('/usersmain/:userId/:itemId/:dataId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const dataId = req.params.dataId;
        const itemId = req.params.itemId;
      
        const user = await UserSchema.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
      
        const watchlistIndex = user.WatchListCreate.findIndex(watchlist => watchlist._id.toString() === itemId);
        if (watchlistIndex === -1) {
            return res.status(404).json({ message: 'Watchlist not found' });
        }

        const watchlist = user.WatchListCreate[watchlistIndex];

        if (watchlist.items.length > 0) {
            const itemIndex = watchlist.items.findIndex(item => item.id === dataId);
            if (itemIndex === -1) {
                return res.status(404).json({ message: 'Item not found' });
            }
            return res.json({ message: 'Items Present In The Array ' });
        
        } else {
            user.WatchListCreate.splice(watchlistIndex, 1);
            await user.save();
            return res.json({ message: 'Watchlist deleted successfully' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


// Signup API
app.post("/signup", async (req, res) => {
    const email = req.body.email;
    let user = await Users.findOne({ email: email })

    if (user) {
        res.send({ message: "you are already a member" })
    }
    else {
        let newUser = new Users(req.body);
        let result = await newUser.save();
        res.send(result);
        result = result.toObject();
    }
});

//deleting the watchlist
app.delete('/deleteWatchlist/:userId/:watchlistName', async (req, res) => {
    const userId = req.params.userId;
    const watchlistName = req.params.watchlistName;
  
    try {
      // Find the user by ID
      const user = await Users.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Find the index of the watchlist with the given name
      const watchlistIndex = user.WatchListCreate.findIndex(watchlist => watchlist.name === watchlistName);
      if (watchlistIndex === -1) {
        return res.status(404).json({ message: 'Watchlist not found' });
      }
  
      // Remove the watchlist object from the array
      user.WatchListCreate.splice(watchlistIndex, 1);
  
      // Save the updated user document
      await user.save();
  
      return res.status(200).json(user.WatchListCreate);
    } catch (error) {
      console.error('Error deleting watchlist:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
// LOgin API
app.post("/login", async (req, res) => {
    let CUsername = req.body.username;
    let user = await Users.findOne({ username: CUsername });
    if (user) {
        let CPassword = req.body.password;
        let SPassword = user.password

        const UserId = {
            user: {
                id: user._id
            }
        }

        if (CPassword === SPassword) {
            res.status(200).send("Your Logged Successfullt" + user)

        } else {
            res.status(409).send("enter valid Password")
        }
    }
    else {
        res.status(404).send("User Not Found");
    }
});


// Password Change
app.put("/changePswrd/:Id", async (req, res) => {
    let userId = req.params.Id
    let user = await Users.findOne({ _id: userId })
    let result = await Users.updateOne(
        { _id: userId }, { $set: { password: req.body.password } }
    )
    console.log(result)
    res.send(result)
});


// Serach Api
app.get('/search', async (req, res) => {
    try {
        const searchQuery = req.query.q;

        const results = await UserSchema.find({
            $or: [
                { CompanyName: { $regex: searchQuery, $options: 'i' } },
                { Information: { $regex: searchQuery, $options: 'i' } },
                { Symbol: { $regex: searchQuery, $options: 'i' } }            ]
        });

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.get('/' , (req, res)=>{
    console.log("welcom to trading");
    res.status(200).json("Welcome to trading")
})

// Server Listten port
app.listen(5000, () => {
    console.log(`Server is running on port 5000`);
});
