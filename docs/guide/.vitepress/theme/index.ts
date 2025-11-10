import DefaultTheme from 'vitepress/theme'
import DocHero from '../components/DocHero.vue'
import DocStat from '../components/DocStat.vue'
import DocCardGrid from '../components/DocCardGrid.vue'
import DocPlaygroundFrame from '../components/DocPlaygroundFrame.vue'
import DocRoadmapCallout from '../components/DocRoadmapCallout.vue'
import './styles.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('DocHero', DocHero)
    app.component('DocStat', DocStat)
    app.component('DocCardGrid', DocCardGrid)
    app.component('DocPlaygroundFrame', DocPlaygroundFrame)
    app.component('DocRoadmapCallout', DocRoadmapCallout)
  },
}
