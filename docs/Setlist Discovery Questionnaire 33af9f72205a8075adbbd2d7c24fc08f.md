# Setlist Discovery Questionnaire

### **🏮 Category 1: The Core Vision & "The Hook"**

*Understanding the heart of the product.*

1. **The "Elevator Pitch":** In two sentences, what is the #1 reason a person would open Setlist instead of just using Spotify or YouTube?
    
    Response: The user will open Setlist to play a game of Music where the songs are the contenders and the people or the users are the referees or the judges, so Setlist is not a music player in essence, but it will provide playing music as well
    
2. **The "Win" Condition:** What defines a successful "session" for a user? (e.g., discovering a new song, winning a vote, hosting a successful party?)
    
    Response: A successful session would be playing a game with a friend or Friends where they listen to songs together and vote in real time as if they were together in one place
    
3. **The Target Audience:** Is this for professional DJs, casual friends at a house party, or global online "clash" rooms?
    
    Response: The target audience is anyone who has a passion for music, loves music, and loves gaming and listening to music in a deeper way
    

### **🎸 Category 2: The "Clash" Mechanics (Deep Dive)**

*This is the most technically complex part of the app.*

1. **The Voting Logic:** How exactly does a "Clash" work? Is it 1v1 songs? A list of 10? Does the song with the most votes play next, or does it win a "round"?
    
    Response: I am planning on having multiple variations of this side either the brackets like the rounds and also the scoring system so I will start with first a draw like the knockout Champions League draw that is in football so we will start by 8 songs in total which will translate to form matches and also 16 songs in total which leads to 8 matches in total and we will start with a simple vote system and the winner from match one will face the winner from match two and so on
    
2. **The Roles:** Is there a "Host" who controls the room, or is it fully democratic?
    
    Response: yes there is a host and that is just for the sake of make the room easy to manage and not for the Host role itself you know
    
3. **Real-time Rules:** If 1,000 people vote at the exact same millisecond, how should the UI react? Should it be a "tug of war" animation, or a simple counter?
    
    Response: first of all the early days they won't be that much of people for single room no we won't do that we will just hold the number of players within a single Clash and that's it
    
4. **Music Source:** Where does the music actually play from? (Integrated Spotify API, YouTube embeds, or our own streaming server?)
    
    Response: I guess due to that I want everything to be free so I guess we will be using the YouTube API as it is the one free
    

### **🎮 Category 3: User Experience & "Gaming Feel"**

*Defining that "Buttery Smooth" requirement.*

1. **Visual Language:** You mentioned a "gaming feel." Should the UI be "Cyberpunk/Dark Mode," "Minimalist/Glassmorphism," or "Retro/Arcade"?
    
    Response: As I mentioned, I want the theme to be solarised, the dark to be easy on the eye, and the game's feeling will be dependent massively on the animation, and in the future, we will add a lot of themes
    
2. **The "Hero" Animation:** What is the one piece of the app that MUST have the coolest animation? (The vote button? The song transition? The winner announcement?)
    
    Response: Every single thing in the app should be unique with either a subtle animation or a huge one, so it gives the app the feel of being alive and has a soul on its own
    
3. **Tactile Feedback:** Do we want haptic feedback (vibrations) on mobile for every vote?
    
    Response: That is not necessary, no
    

### **📈 Category 4: Scale & Architecture**

*Preparing for millions of users.*

1. **Concurrency:** When we say "millions," do we mean millions of separate small rooms (2-10 people each), or several MASSIVE rooms (10,000+ people each)?
    
    Response: millions of separate small rooms (2-10 people each)
    
2. **Data Persistence:** Do we need to save the history of every single vote ever cast, or do we "wipe the slate clean" after a Clash ends?
    
    Response: each clash will have its own data reserved in the database, each and every single thing happened inside that clash will be saved
    
3. **Offline Mode:** Should the app do anything if the user loses internet, or is it 100% "Live or Die"?
    
    Response: We need to discuss this much further as i don’t know what the limits are
    

### **👤 Category 5: User & Social**

*Building the community.*

1. **Onboarding:** How fast should a user go from "I just downloaded this" to "I am in a Clash"? (e.g., Guest mode vs. Required Login).
    
    Response: he will need to sign in with google and then have a friend and songs in the library to play with
    
2. **Profiles:** Are users anonymous "avatars," or do they have full profiles with "XP," "Levels," and "Top Songs"?
    
    Response: they will have their gmail photos and we will add the avatar option later in the future
    and they will have xp and levels and all the possible data about them saved in monitored inside of our database as well
    
3. **Social Links:** Can a user "Follow" a great Host or "Friend" someone they met in a room?
    
    Response: they can add them as a friend
    

### **💰 Category 6: Future & Expansion**

*Thinking two years ahead.*

1. **Monetization (Optional):** Even if it's free now, how would it make money later? (Ads, Premium "Skins" for rooms, Featured Artists?)
    
    Response: ads yeah maybe depending on the ads and also the number of clashes a person can use and maybe a yt integration to the user’s original yt profile option as well 
    
2. **The "Dream" Feature:** If you had an infinite budget and 100 developers, what is the one "impossible" feature you'd want to add?
    
    Response: to have my own legal music library and don’t need yt music maybe i guess that would save the depending on the music which is the heart of the app