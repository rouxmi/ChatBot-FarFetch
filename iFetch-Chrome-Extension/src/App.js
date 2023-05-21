/*global chrome*/
import "./App.css";
import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, ScrollView, View } from "react-native";

// const MESSAGES_ENDPOINT = "https://ifetch.novasearch.org/agent/"
const MESSAGES_ENDPOINT = "http://127.0.0.1:4000";
const PROFILE_ENDPOINT = MESSAGES_ENDPOINT + "/profile";

function Recomenadation(props) {
    const recommendations = props.message.recommendations;
    const profile = props.app;

    const [img, setImg] = useState();
    const [index, setIndex] = useState(0);
    const message = recommendations[index].message;

    var temp = {
        brand: recommendations[index].brand,
        image_path: recommendations[index].image_path,
    }

    const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

    const fetchImage = async (imageUrl) => {
        const res = await fetch(imageUrl);
        const imageBlob = await res.blob();
        const imageObjectURL = URL.createObjectURL(imageBlob);
        setImg(imageObjectURL);
        return imageObjectURL;
    };

    const like = (Recomenadation) => {
        var product_id = Recomenadation.id;

        const button = document.getElementById("heart-button" + product_id);
        if (button.className === "heart-button") {
            button.className = "heart-button__liked";
            const temp = {
                brand: Recomenadation.brand,
                image_path: Recomenadation.image_path,
            }
            profile.products.push(temp);
        } else {
            button.className = "heart-button";
            const temp = {
                brand: Recomenadation.brand,
                image_path: Recomenadation.image_path,
            }

            profile.products = profile.products.filter((product) => {
                return product.brand !== temp.brand;
            }
            );
        }
    };

    var click = (dir) => {
        const button = document.getElementById("heart-button" + recommendations[index].id);
        if (isItemLiked(recommendations[clamp(index + dir * 1, 0, recommendations.length - 1)])) {
            button.className = "heart-button__liked";
        } else {
            button.className = "heart-button";
        }
        setIndex(clamp(index + dir * 1, 0, recommendations.length - 1));
    };

    function isItemLiked(item) {
        var found = false;
        for (var i = 0; i < profile.products.length; i++) {
            if (profile.products[i].image_path === item.image_path) {
                found = true;
                break;
            }
        }
        return found;
    }

    return (
        <div className="response">
            <div
                className={
                    props.is_user ? "message-content-user" : "message-content-bot"
                }
            >
                {message}
            </div>
            <div className="landscape-view">
                <button
                    className={index === 0 ? "invisible-button" : "regular-arrows"}
                    onClick={() => {
                        click(-1);
                    }}
                >
                    {"<"}
                </button>
                <div className="image-container">
                    <img
                        src={recommendations[index].image_path}
                        style={{ alignSelf: "center" }}
                    />
                    <button
                        className={isItemLiked(recommendations[index]) ? "heart-button__liked" : "heart-button"}
                        id={"heart-button" + recommendations[index].id}
                        onClick={() => {
                            like(recommendations[index]);
                        }}
                    >
                        <i
                            className="fas fa-heart"
                        >
                        </i>
                    </button>
                </div>
                <button
                    className={
                        index == recommendations.length - 1
                            ? "invisible-button"
                            : "regular-arrows"
                    }
                    onClick={() => {
                        click(1);
                    }}
                >
                    {">"}
                </button>
            </div>
        </div>
    );
}



// function for printing a message
function Message(props) {
    const ref = useRef();

    var message = props.message;
    var is_user = props.message.provider_id != "iFetch";
    var recommendations = message.recommendations;

    useEffect(() => {
        if (ref.current) {
            ref.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }, []);

    return (
        <div className={is_user ? "message-user" : "message-bot"} ref={ref}>
            <div className={is_user ? "message-content-user" : "message-content-bot"}>
                {message.utterance}
            </div>
            {recommendations.length != 0 ? (
                <Recomenadation message={message} is_user={is_user} app={props.app} />
            ) : (
                <></>
            )}
            <div
                className={is_user ? "message-timestamp-user" : "message-timestamp-bot"}
            >
                {message.provider_id}
            </div>
        </div>
    );
}

// Fnction responsible for printing all the messages
function Messages(props) {
    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            {props.messages.map((message, i) => {
                return (
                    <View key={message.provider_id + i}>
                        <Message message={message} app={props.app}/>
                    </View>
                );
            })}
        </ScrollView>
    );
}

// Function that sends a message form
function SendMessageForm(props) {
    const [message, setMessage] = useState("");

    var handleChange = (e) => {
        setMessage(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        props.handleSubmit(message);
        setMessage("");
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                className="text-form"
                onChange={handleChange}
                value={message}
                placeholder="Type your message and hit ENTER"
                type="text"
            />
        </form>
    );
}

// Function responsible for sending
//  a message to the backend
async function SendMessage(
    utterance,
    userId,
    sessionId,
    userAction,
    selectedId,
    respondeCallback,
    image = null,
    isUpToDate = false
) {
    const response = await fetch(MESSAGES_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
            utterance: utterance, // The users utterance
            user_id: userId, // The users ID
            session_id: sessionId, // The current session ID
            user_action: userAction, // The users action
            interface_selected_product_id: selectedId, // the ID of the opened product
            file: image, // the image uploaded by the user
            // document: document // The HTML of the page
        }),
        headers: {
            "Content-type": "application/json",
        },
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            respondeCallback(data, utterance, isUpToDate);
        })
        .catch((err) => {
            console.log(err.message);
        });

    return response;
}

// Function that gets a random value between
//  min and max
function randomNumberInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function App() {
    const [messages, setMessages] = useState([]);
    const [showContent, setShowContent] = useState(false);
    const [userID, setUserID] = useState(`${randomNumberInRange(0, 10000)}`);
    const [sessionID, setSessionID] = useState(
        `${randomNumberInRange(0, 10000)}`
    );
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const inputRef = useRef(null);

    const setChatbox = () => {
        setShowContent(!showContent);
    };

    const [profile, setProfile] = useState({
        women: false,
        men: false,
        kids: false,
        beauty: false,
        state: "tops",
        products: [],
    });

    const randomItem = async (item,state) => {
        if (item != null) {
            //get the inner Html of every button in item
            for (var i = 0; i < item.length; i++) {
                var innerHtml = item[i].innerHTML;
                if (innerHtml === "Women") profile.women = true;
                if (innerHtml === "Men") profile.men = true;
                if (innerHtml === "Kids") profile.kids = true;
                if (innerHtml === "Beauty") profile.beauty = true;
            }
        }
        profile.state = state;
        const response = await fetch(PROFILE_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-type": "application/json",
            },
            //add profile to the request in a json format
            body: JSON.stringify({ 
                women : profile.women,
                men : profile.men,
                kids : profile.kids,
                beauty : profile.beauty,
                state : profile.state,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                return data.recommendations;
            })
            .catch((err) => {  
                console.log(err.message);
            });

        return response;
    };

    

    function setStartSelectingLikedItem () {
        // Get the number of selected items
        const selectedItems = document.getElementsByClassName("button-category-selected");
        // If there are no selected items, show a message
        if (selectedItems.length == 0) {
            const buttonContainer = document.getElementsByClassName("button-category-container")[0];
            const message = document.createElement("div");
            message.className = "alert-message";
            message.innerHTML = "Please select at least one category";
            if (buttonContainer.childElementCount == 5) {
                buttonContainer.appendChild(message);
                return;
            }
        }
        
        const randomProduct = randomItem(selectedItems, "tops");
        //deleting the previous button
        const buttonContainer = document.getElementsByClassName("button-category-container")[0];
        buttonContainer.innerHTML = "";
        //wait for the profile image to be loaded
        randomProduct.then((data) => {
            createItemList(data);
        });
    };

    function likeButton(button) {
        if (button.className === "heart-button") {
            button.className = "heart-button__liked";
            return;
        }
        if (button.className === "heart-button__liked") {
            button.className = "heart-button";
            return;
        }
    }


    function createItemList(data){
        const container = document.getElementById("content-container");
        if (container.childElementCount > 0) {
            container.removeChild(container.lastChild);
        }
        //replace the content-container by a grid of card 
        container.className = "grid-container";
        //add a title that says "Select your favorite product" and take the whole top row
        const title = document.createElement("div");
        title.className = "title-list";
        title.id = "title-list";
        title.innerHTML = "Select your favorite product";
        title.style.gridColumn = "1 / span 3";
        container.appendChild(title);
        for (let i = 0; i < data.length; i++) {
            const card = document.createElement("div");
            card.className = "card";
            card.id = i;
            
            const imgContainer = document.createElement("div");
            imgContainer.className = "img-container";
            const img = document.createElement("img");
            img.src = data[i].image_path;
            imgContainer.appendChild(img);
            const heartButton = document.createElement("button");
            heartButton.className = "heart-button";
            const heartIcon = document.createElement("i");
            heartIcon.className = "fas fa-heart";
            heartButton.appendChild(heartIcon);
            imgContainer.appendChild(heartButton);
            card.appendChild(imgContainer);
            card.onclick = () => {
                selectCard(card);
                likeButton(heartButton);
            };
            const title = document.createElement("div");
            title.className = "title-card";
            title.innerHTML = data[i].brand;
            card.appendChild(title);
            container.appendChild(card);
        }
        //add a fix button in middle of the bottom
        const button = document.createElement("button");
        button.className = "Done-button";
        button.innerHTML = "Validate";
        button.onclick = () => {
            createProfile();
        }
        container.appendChild(button);
    }

    function setStartSelectingProfile(){
        const container = document.getElementById("content-container");
        container.removeChild(document.getElementsByClassName("logo-container")[0]);
        container.removeChild(document.getElementsByClassName("button-container")[0]);
        container.removeChild(document.getElementsByClassName("continue-container")[0]);
        // make a list of 4 buttons one for kids, one for women, one for men and one for beauty
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "button-category-container";
        const kidsButton = document.createElement("button");
        kidsButton.className = "button-category";
        kidsButton.innerHTML = "Kids";
        kidsButton.onclick = () => {
            selectItem(kidsButton);
        }
        buttonContainer.appendChild(kidsButton);
        const womenButton = document.createElement("button");
        womenButton.className = "button-category";
        womenButton.innerHTML = "Women";
        womenButton.onclick = () => {
            selectItem(womenButton);
        }
        buttonContainer.appendChild(womenButton);
        const menButton = document.createElement("button");
        menButton.className = "button-category";
        menButton.innerHTML = "Men";
        menButton.onclick = () => {
            selectItem(menButton);
        }
        buttonContainer.appendChild(menButton);
        const beautyButton = document.createElement("button");
        beautyButton.className = "button-category";
        beautyButton.innerHTML = "Beauty";
        beautyButton.onclick = () => {
            selectItem(beautyButton);
        }
        buttonContainer.appendChild(beautyButton);
        //add a button to validate the selection
        const button = document.createElement("button");
        button.className = "Done-button-category";
        button.innerHTML = "Validate";
        button.onclick = () => {
            setStartSelectingLikedItem();
        }
        buttonContainer.appendChild(button);
        container.appendChild(buttonContainer);
    }

    const selectItem = (item) => {
        //delete the message if exist
        const buttonContainer = document.getElementsByClassName("button-category-container")[0];
        if (buttonContainer.childElementCount == 6) {
            buttonContainer.removeChild(buttonContainer.lastChild);
        }
        // if the card is already selected, unselect it
        if (item.className === "button-category-selected") {
            item.className = "button-category";
        } else {
            item.className = "button-category-selected";
        }
    };


    function createProfile() {
        //get all the selected cards
        const cards = document.getElementsByClassName("card-selected");
        const selectedCards = [];
        for (let i = 0; i < cards.length; i++) {
            const tempCard = {
                brand: cards[i].children[1].innerHTML,
                image_path: cards[i].children[0].src,
            }
            profile.products.push(tempCard);
        }
        //send the selected cards to the backend
        if (cards.length == 0) {
            const container = document.getElementById("content-container");
            const message = document.createElement("div");
            message.className = "alert-message";
            message.innerHTML = "Please select at least one product";
            message.style.gridColumn = "1 / span 3";
            container.scrollTo(0, 0);
            if (container.childElementCount == 33) {
                return;
            }
            // container is a grid container append message under the title
            container.insertBefore(message, container.children[1]);
            return;
        } else {
            const container = document.getElementById("content-container");
            container.innerHTML = "";
            //create a new request to the backend for the pants or the shoes
            if (profile.state === "tops"){
                const randomProduct = randomItem(null, "pants");
                //wait for the profile image to be loaded
                console.log(randomProduct);
                randomProduct.then((data) => {
                    createItemList(data);
                });
            } else if (profile.state === "pants"){
                const randomProduct = randomItem(null, "shoes");
                //wait for the profile image to be loaded
                randomProduct.then((data) => {
                    createItemList(data);
                });
            } else if (profile.state === "shoes"){
                //create the profile
                console.log("create profile with the following data");
                console.log(profile);
                setChatbox();
            }
        }
    }

    const selectCard = (card) => {
        if (document.getElementsByClassName("alert-message")[0]) {
            const container = document.getElementById("content-container");
            container.removeChild(container.children[1]);
        }
        // if the card is already selected, unselect it
        if (card.className === "card-selected") {
            card.className = "card";
        } else {
            card.className = "card-selected";
        }
    };

    const logo = "farfetch-logo.png";

    const initialMessage = () => {
        const message = {
            message: "Hello from React",
            uID: userID,
            sID: sessionID,
        };

        const queryInfo = {
            active: true,
            currentWindow: true,
        };

        chrome.tabs &&
            chrome.tabs.query(queryInfo, (tabs) => {
                const currentTabId = tabs[0].id;
                chrome.tabs.sendMessage(currentTabId, message, (response) => {
                    console.log(response);
                });
            });
    };

    const handleSubmit = (message) => {
        // if (!hasResponded) return // safety code

        const temp = {
            provider_id: "user",
            utterance: message,
            recommendations: [],
        };

        setMessages([...messages, temp]);
        SendMessage(
            message,
            userID,
            sessionID,
            "",
            "",
            recieveMessage,
            selectedImage
        );
        setSelectedImage(null);
        inputRef.current.value = null;
        setSelectedFile(null);
    };

    const recieveMessage = (message, utterance, isUpToDate = false) => {
        // if (!message.has_response) return // safety code

        const temp1 = {
            provider_id: "iFetch",
            utterance: message.response,
            recommendations:
                message.recommendations == null ? [] : message.recommendations,
        };

        if (isUpToDate) {
            setMessages([...messages, temp1]);
            return;
        }

        const temp2 = {
            provider_id: "user",
            utterance: utterance,
            recommendations: [],
        };

        setMessages([...messages, temp2, temp1]);
    };

    useEffect(() => {
        const response = SendMessage(
            "Hi!",
            userID,
            sessionID,
            "",
            "",
            recieveMessage,
            null,
            true
        );
        initialMessage();
    }, []);

    const selectFileHandler = (event) => {
        console.log(event.target.files[0]);
        let reader = new FileReader();

        reader.readAsDataURL(event.target.files[0]);
        setSelectedFile(event.target.files[0]);

        reader.onload = () => {
            setSelectedImage(reader.result);
        };
    };

    function setChatbot(){
        const container = document.getElementById("content-container");
        container.removeChild(document.getElementsByClassName("logo-container")[0]);
        container.removeChild(document.getElementsByClassName("button-container")[0]);
        container.removeChild(document.getElementsByClassName("continue-container")[0]);
        container.className = "chat-container";
        setChatbox();
    }

    return (
        <div>
            <div> {showContent ? null :
                <div className="content-container" id="content-container">
                    <div className="logo-container">
                        <img src={logo} className="logo" />
                    </div>
                    <div className="button-container">
                        <button onClick={setStartSelectingProfile} className="chat-button">
                            Start IFetch
                        </button>
                    </div>
                    <div className="continue-container">
                        <button className="continue-text" onClick={setChatbot}>Continue without setting up a profile</button>
                    </div>
                </div> }
            </div>
            <div>
                {showContent ? 
                    <div className='chat-container'>
                        <div className='title-container'>
                            <h1 className='message-content-bot'>iFetch</h1>
                        </div>
                        <View style={styles.container}>
                        <Messages messages={messages} app={profile}/>
                        </View>
                        <div className='form-container'>
                        <SendMessageForm handleSubmit = {handleSubmit}/>
                        <input ref = {inputRef} className= 'image-input' 
                            type='file' placeholder="Upload an Image" 
                            required onChange={selectFileHandler} text='Upload an Image'
                        />
                        </div>
                    </div> : null}
            </div>
        </div>
        
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: "20px",
        flex: 1,
        height: "350px",
    },
});

export default App;
