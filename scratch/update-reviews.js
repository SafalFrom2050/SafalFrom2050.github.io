const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '../blog/posts');
const verdicts = {
    'rooftop-survival-simplified-edition.md': "A surprisingly addictive distillation of survival mechanics. It strips away the bloat and leaves you with pure, adrenaline-pumping gameplay.",
    '2048-with-screen-shake.md': "We didn't know 2048 needed screen shake, but now we can't play it any other way. The added 'juice' makes every combination feel immensely satisfying.",
    'claude-just-killed-everyone.md': "Darkly hilarious and wildly unpredictable. It's a fascinating look at how AI interprets chaotic narrative prompts into playable mechanics.",
    'urban-blasted-crate-chaos.md': "Pure arcade fun. Smashing crates has never felt so good, and the physics engine holds up surprisingly well against the mayhem.",
    'jlpt-n3-kanji-pop.md': "Educational games are rarely this engaging. It gamifies language learning in a way that actually makes studying feel like a high-score chase.",
    'catch-the-food-streak-edition.md': "A classic concept polished to a mirror shine. The streak multiplier system turns a simple catching game into a high-stakes test of reflexes.",
    'jedi-potato-run-force-push-edition.md': "The title says it all. It's absurd, hilarious, and genuinely fun. Using 'force push' as a core mechanic adds a great layer of strategy.",
    'vitreous-keys.md': "A mesmerizing showcase of WebXR capabilities. Playing a virtual piano on your actual coffee table feels like catching a glimpse of the future.",
    'velocity-vestige.md': "One of the most physically engaging AR games we've seen. Hitting virtual notes in your real room is an absolute workout and a blast.",
    'alarm-smash.md': "The perfect stress reliever. It takes a universal frustration and turns it into a tightly designed, highly cathartic arcade shooter."
};

fs.readdirSync(POSTS_DIR).forEach(file => {
    if (verdicts[file]) {
        const filePath = path.join(POSTS_DIR, file);
        let content = fs.readFileSync(filePath, 'utf-8');
        content = content.replace(/^review:\s*".*"$/m, `review: "${verdicts[file]}"`);
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${file}`);
    }
});
