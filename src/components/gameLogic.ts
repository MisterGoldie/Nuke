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
        message: 'Draw a card to begin!',
        playerHasNuke: true,
        cpuHasNuke: true,
        isNukeActive: false,
        readyForNextCard: false
    };
}
  
function shuffle<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = newArray[i]!;
        newArray[i] = newArray[j]!;
        newArray[j] = temp;
    }
    return newArray;
}
  
export function drawCards(state: LocalState): LocalState {
    const newState = { ...state };

    // If cards are face down, flip them up
    if (!newState.playerCard && !newState.cpuCard) {
        newState.playerCard = newState.playerDeck.shift() || null;
        newState.cpuCard = newState.cpuDeck.shift() || null;
        
        if (newState.playerCard && newState.cpuCard) {
            const playerRank = newState.playerCard.rank;
            const cpuRank = newState.cpuCard.rank;
            
            if (playerRank > cpuRank) {
                newState.message = "You win this round!";
                newState.readyForNextCard = true;
            } else if (cpuRank > playerRank) {
                newState.message = "CPU wins this round!";
                newState.readyForNextCard = true;
            } else {
                newState.message = "WAR!";
                newState.isWar = true;
            }
        }
        return newState;
    }

    // Handle previous round cleanup
    if (newState.playerCard && newState.cpuCard) {
        // Move cards to appropriate decks
        if (newState.playerCard.rank > newState.cpuCard.rank) {
            newState.playerDeck = [...newState.playerDeck, newState.playerCard, newState.cpuCard];
        } else if (newState.cpuCard.rank > newState.playerCard.rank) {
            newState.cpuDeck = [...newState.cpuDeck, newState.playerCard, newState.cpuCard];
        }
        
        // Clear cards and prepare for next round
        newState.playerCard = null;
        newState.cpuCard = null;
        newState.message = "Draw a card to continue!";
        newState.readyForNextCard = false;
    }

    return newState;
}
  
export function handleNuke(state: LocalState, initiator: 'player' | 'cpu'): LocalState {
    const newState = { ...state };
    
    if (initiator === 'player' && newState.playerHasNuke && newState.cpuDeck.length >= 10) {
        // Player initiates nuke
        const stolenCards = newState.cpuDeck.splice(-10);
        newState.playerDeck.unshift(...stolenCards);
        newState.playerHasNuke = false;
        newState.message = "NUKE LAUNCHED! You stole 10 cards!";
        newState.isNukeActive = true;
    } else if (initiator === 'cpu' && newState.cpuHasNuke && newState.playerDeck.length >= 10) {
        // CPU initiates nuke
        const stolenCards = newState.playerDeck.splice(-10);
        newState.cpuDeck.unshift(...stolenCards);
        newState.cpuHasNuke = false;
        newState.message = "CPU LAUNCHED A NUKE! Lost 10 cards!";
        newState.isNukeActive = true;
    }

    return newState;
} 