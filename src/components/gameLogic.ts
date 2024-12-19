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
        playerCard: null,
        cpuCard: null,
        warPile: [],
        isWar: false,
        gameOver: false,
        message: 'Draw a card to begin',
        playerHasNuke: true,
        cpuHasNuke: true,
        isNukeActive: false,
        readyForNextCard: false
    };
}
  
function shuffle<T>(array: T[]): T[] {
    const newArray = [...array];
    
    // First basic shuffle
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = newArray[i]!;
        newArray[i] = newArray[j]!;
        newArray[j] = temp;
    }

    // Split the deck into two halves
    const midpoint = Math.floor(newArray.length / 2);
    const playerHalf = newArray.slice(0, midpoint);
    const cpuHalf = newArray.slice(midpoint);

    // Sort each half to favor the player
    playerHalf.sort((a: any, b: any) => b.rank - a.rank); // Higher ranks for player
    cpuHalf.sort((a: any, b: any) => a.rank - b.rank);   // Lower ranks for CPU

    // Add some randomness back but maintain the general advantage
    for (let i = playerHalf.length - 1; i > 0; i--) {
        if (Math.random() < 0.3) { // Only swap 30% of the time
            const j = Math.floor(Math.random() * (i + 1));
            const temp = playerHalf[i]!;
            playerHalf[i] = playerHalf[j]!;
            playerHalf[j] = temp;
        }
    }

    // Combine the halves back together
    return [...playerHalf, ...cpuHalf];
}
  
export function drawCards(state: LocalState): LocalState {
    const newState = { ...state };
    
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

    // Draw cards
    newState.playerCard = newState.playerDeck.shift()!;
    newState.cpuCard = newState.cpuDeck.shift()!;
    
    const playerRank = newState.playerCard.rank;
    const cpuRank = newState.cpuCard.rank;
    
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
        newState.message = "WAR! 3 cards each drawn";
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
            newState.message = newState.playerDeck.length < 3 
                ? "Game Over - Not enough cards for WAR! CPU wins!" 
                : "Game Over - Not enough cards for WAR! You win!";
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
    
    if (initiator === 'player' && newState.playerHasNuke && newState.cpuDeck.length >= 10) {
        const stolenCards = newState.cpuDeck.splice(-10, 10);
        newState.playerDeck.unshift(...stolenCards);
        newState.playerHasNuke = false;
        newState.isNukeActive = true;
        newState.message = "NUKE LAUNCHED! You stole 10 cards!";
        
        // Check if this was a winning move
        if (newState.cpuDeck.length === 0) {
            newState.gameOver = true;
            newState.message = "Game Over - You win with a NUKE!";
        }
    } else if (initiator === 'cpu' && newState.cpuHasNuke && newState.playerDeck.length >= 10) {
        const stolenCards = newState.playerDeck.splice(-10, 10);
        newState.cpuDeck.unshift(...stolenCards);
        newState.cpuHasNuke = false;
        newState.isNukeActive = true;
        newState.message = "CPU LAUNCHED A NUKE! You lost 10 cards";
        
        // Check if this was a winning move
        if (newState.playerDeck.length === 0) {
            newState.gameOver = true;
            newState.message = "Game Over - CPU wins with a NUKE!";
        }
    }
    
    return newState;
} 