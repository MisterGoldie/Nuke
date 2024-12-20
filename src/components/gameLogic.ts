export interface Card {
    rank: number;
    suit: string;
    display: string;
    symbol: string;
}
  
export interface LocalState {
    playerDeck: Card[];
    cpuDeck: Card[];
    playerCard: Card | null;
    cpuCard: Card | null;
    warPile: Card[];
    isWar: boolean;
    gameOver: boolean;
    message: string;
    playerHasNuke: boolean;
    cpuHasNuke: boolean;
    isNukeActive: boolean;
    readyForNextCard: boolean;
    gameStartTime?: number;
}
  
export function createDeck(): Card[] {
    const suits = ['♠️', '♣️', '♥️', '♦️'];
    const ranks = Array.from({ length: 13 }, (_, i) => i + 2);
    const displayRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: Card[] = [];
    
    for (const suit of suits) {
        ranks.forEach((rank, i) => {
            const actualRank = displayRanks[i] === 'A' ? 14 : rank;
            deck.push({
                rank: actualRank,
                suit,
                display: displayRanks[i],
                symbol: `${displayRanks[i]}${suit}`
            });
        });
    }
    return shuffle(deck);
}
  
export function initializeGame(): LocalState {
    const deck = createDeck();
    const midpoint = Math.floor(deck.length / 2);
    
    return {
        playerDeck: deck.slice(0, midpoint),
        cpuDeck: deck.slice(midpoint),
        warPile: [],
        gameOver: false,
        message: "Draw card to begin",
        readyForNextCard: true,
        isWar: false,
        playerHasNuke: true,
        cpuHasNuke: true,
        isNukeActive: false,
        gameStartTime: Date.now(),
        playerCard: null,
        cpuCard: null
    };
}
  
function shuffle<T>(array: T[]): T[] {
    const newArray = [...array];
    
    // Modified Fisher-Yates shuffle with slight player advantage
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // Add 20% chance to favor higher cards in player's initial deck
        if (i < newArray.length / 2 && Math.random() < 0.2) {
            continue; // Skip this swap to keep higher cards in first half
        }
        const temp = newArray[i]!;
        newArray[i] = newArray[j]!;
        newArray[j] = temp;
    }
    
    return newArray;
}
  
export function drawCards(state: LocalState): LocalState {
    const newState = { ...state };
    
    // Check if game has been running for more than 2 minutes
    const gameRunningTime = Date.now() - (newState.gameStartTime || Date.now());
    const isLongGame = gameRunningTime > 120000; // 2 minutes in milliseconds
    
    // If it's a long game, favor the player with more cards
    if (isLongGame) {
        const playerIsWinning = newState.playerDeck.length > newState.cpuDeck.length;
        const leaderDeckSize = Math.max(newState.playerDeck.length, newState.cpuDeck.length);
        const followerDeckSize = Math.min(newState.playerDeck.length, newState.cpuDeck.length);
        
        // Higher chance to favor leader as their advantage grows
        const advantage = (leaderDeckSize - followerDeckSize) / 52; // normalized difference
        const favorChance = Math.min(0.5, 0.3 + advantage); // 30-50% chance based on lead
        
        if (Math.random() < favorChance) {
            // Draw cards first to see outcome
            newState.playerCard = newState.playerDeck.shift()!;
            newState.cpuCard = newState.cpuDeck.shift()!;
            
            // If result doesn't favor leader, swap cards
            const playerWinsNaturally = newState.playerCard.rank > newState.cpuCard.rank;
            if (playerIsWinning !== playerWinsNaturally) {
                const temp = newState.playerCard;
                newState.playerCard = newState.cpuCard;
                newState.cpuCard = temp;
            }
            
            return newState;
        }
    }
    
    // Check if this is the first draw of the game
    const isFirstDraw = !newState.playerCard && !newState.cpuCard && 
                       newState.playerDeck.length === 26 && 
                       newState.cpuDeck.length === 26;
    
    // Skip CPU NUKE check if it's the first draw
    if (!isFirstDraw && newState.cpuHasNuke && newState.playerDeck.length >= 10 && Math.random() < 0.10) {
        const nukeState = handleNuke(newState, 'cpu');
        nukeState.isNukeActive = true;
        return nukeState;
    }
    
    // Check if previous state was a war
    const wasWar = newState.isWar;
    
    // Draw cards
    newState.playerCard = newState.playerDeck.shift()!;
    newState.cpuCard = newState.cpuDeck.shift()!;
    
    const playerRank = newState.playerCard.rank;
    const cpuRank = newState.cpuCard.rank;
    
    // If it was a war or cards are equal, redraw CPU card to prevent consecutive wars
    if ((wasWar || playerRank === cpuRank) && newState.cpuDeck.length > 0) {
        newState.cpuDeck.unshift(newState.cpuCard); // Put the card back
        
        // Keep drawing until we get a card that won't cause war
        let foundDifferentCard = false;
        const tempDeck = [...newState.cpuDeck];
        
        while (tempDeck.length > 0 && !foundDifferentCard) {
            const nextCard = tempDeck.shift()!;
            if (nextCard.rank !== playerRank) {
                newState.cpuCard = nextCard;
                newState.cpuDeck = tempDeck;
                foundDifferentCard = true;
            }
        }
        
        // If we couldn't find a different card, CPU loses
        if (!foundDifferentCard) {
            newState.gameOver = true;
            newState.message = "Game Over - You win! CPU couldn't avoid WAR!";
            return newState;
        }
    }
    
    // Check for game over conditions first
    if (newState.playerDeck.length === 0) {
        newState.gameOver = true;
        newState.message = "Game Over - CPU wins!";
        return newState;
    }
    
    if (newState.cpuDeck.length === 0) {
        newState.gameOver = true;
        newState.message = "Game Over - You win!";
        return newState;
    }

    // Compare cards and handle outcomes
    if (playerRank > cpuRank) {
        if (newState.warPile.length > 0) {
            newState.message = `You wins WAR with ${newState.playerCard.display}${newState.playerCard.suit}! (${newState.warPile.length + 2} cards won)`;
            newState.playerDeck.push(...newState.warPile);
            newState.warPile = [];
        } else {
            newState.message = `You wins with ${newState.playerCard.display}${newState.playerCard.suit}`;
        }
        newState.playerDeck.push(newState.playerCard, newState.cpuCard);
        newState.readyForNextCard = true;
    } else if (cpuRank > playerRank) {
        if (newState.warPile.length > 0) {
            newState.message = `CPU wins WAR with ${newState.cpuCard.display}${newState.cpuCard.suit}! (${newState.warPile.length + 2} cards won)`;
            newState.cpuDeck.push(...newState.warPile);
            newState.warPile = [];
        } else {
            newState.message = `CPU wins with ${newState.cpuCard.display}${newState.cpuCard.suit}`;
        }
        newState.cpuDeck.push(newState.playerCard, newState.cpuCard);
        newState.readyForNextCard = true;
    } else {
        newState.message = "WAR!";
        newState.isWar = true;
        
        if (newState.playerDeck.length >= 3 && newState.cpuDeck.length >= 3) {
            newState.warPile.push(newState.playerCard, newState.cpuCard);
            newState.playerCard = null;
            newState.cpuCard = null;
            
            for (let i = 0; i < 2; i++) {
                newState.warPile.push(newState.playerDeck.shift()!);
                newState.warPile.push(newState.cpuDeck.shift()!);
            }
        } else {
            newState.gameOver = true;
            newState.message = newState.playerDeck.length < 3 ? 
                "Game Over - Not enough cards for WAR! CPU wins!" : 
                "Game Over - Not enough cards for WAR! You win!";
        }
    }
    
    return newState;
}
  
export function handleNuke(state: LocalState, initiator: 'player' | 'cpu'): LocalState {
    const newState = {
        ...state,
        playerDeck: [...state.playerDeck],
        cpuDeck: [...state.cpuDeck]
    };
    
    if (initiator === 'player' && newState.playerHasNuke) {
        // If CPU has less than 10 cards, they lose immediately
        if (newState.cpuDeck.length < 10) {
            newState.gameOver = true;
            newState.message = "Game Over - You win with a NUKE!";
            return newState;
        }
        
        // Otherwise, steal 10 cards
        const stolenCards = newState.cpuDeck.splice(-10, 10);
        newState.playerDeck.push(...stolenCards);
        newState.playerHasNuke = false;
        newState.isNukeActive = true;
        newState.message = "NUKE LAUNCHED! You stole 10 cards!";
    } else if (initiator === 'cpu' && newState.cpuHasNuke) {
        // If player has less than 10 cards, they lose immediately
        if (newState.playerDeck.length < 10) {
            newState.gameOver = true;
            newState.message = "Game Over - CPU wins with a NUKE!";
            return newState;
        }
        
        // Otherwise, steal 10 cards
        const stolenCards = newState.playerDeck.splice(-10, 10);
        newState.cpuDeck.push(...stolenCards);
        newState.cpuHasNuke = false;
        newState.isNukeActive = true;
        newState.message = "CPU LAUNCHED A NUKE! You lost 10 cards";
    }
    
    return newState;
} 