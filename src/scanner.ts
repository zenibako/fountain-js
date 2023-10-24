import { rules } from './rules';
import { 
    ActionToken,
    BoneyardToken,
    CenteredToken,
    DialogueBlock,
    LyricsToken,
    NoteToken,
    PageBreakToken,
    SceneHeadingToken,
    SectionToken,
    SynopsisToken,
    TitlePageBlock,
    Token,
    TransitionToken
} from './token';

export class Scanner {
    private lastLineWasDualDialogue: boolean;

    tokenize(script: string): Token[] {
        // reverse the array so that dual dialog can be constructed bottom up
        const source: string[] = script
                            .replace(rules.boneyard, '\n$1\n')
                            .replace(/\r\n|\r/g, '\n')                      // convert carriage return / returns to newline
                            .replace(/^\t+|^ {3,}/gm, '')                   // remove tabs / 3+ whitespaces
                            .split(rules.splitter)
                            .reverse();

        const tokens: Token[] = source.reduce((previous: Token[], line: string) => {
            /** title page */
            if (TitlePageBlock.matchedBy(line)) {
                return new TitlePageBlock(line).addTo(previous);
            }
            /** scene headings */
            if (SceneHeadingToken.matchedBy(line)) {
                return new SceneHeadingToken(line).addTo(previous);
            }
            /** centered */
            if (CenteredToken.matchedBy(line)) {
                return new CenteredToken(line).addTo(previous);
            }
            /** transitions */
            if (TransitionToken.matchedBy(line)) {
                return new TransitionToken(line).addTo(previous);
            }
            /** dialogue blocks - characters, parentheticals and dialogue */
            if (DialogueBlock.matchedBy(line)) {
                const dialogueBlock = new DialogueBlock(line, this.lastLineWasDualDialogue);
                this.lastLineWasDualDialogue = dialogueBlock.dual;
                return dialogueBlock.addTo(previous);
            }
            /** section */
            if (SectionToken.matchedBy(line)) {
                return new SectionToken(line).addTo(previous);
            }
            /** synopsis */
            if (SynopsisToken.matchedBy(line)) {
                return new SynopsisToken(line).addTo(previous);
            }
            /** notes */
            if (NoteToken.matchedBy(line)) {
                return new NoteToken(line).addTo(previous);
            }
            /** boneyard */
            if (BoneyardToken.matchedBy(line)) {
                return new BoneyardToken(line).addTo(previous);
            }
            /** lyrics */
            if (LyricsToken.matchedBy(line)) {
                return new LyricsToken(line).addTo(previous);
            }
            /** page breaks */
            if (PageBreakToken.matchedBy(line)) {
                return new PageBreakToken().addTo(previous);
            }
            /** action */
            return new ActionToken(line).addTo(previous);
        }, []);

        return tokens.reverse();
    }
}