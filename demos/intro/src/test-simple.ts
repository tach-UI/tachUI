// Very simple test without any imports that might fail
console.log('Script loaded')

const app = document.getElementById('app')
if (app) {
  app.innerHTML = '<h1>Basic HTML works</h1>'
  console.log('Basic HTML added to app container')
} else {
  console.error('App container not found')
}

// Test if TachUI imports work
try {
  import('@tachui/core').then((TachUI) => {
    const core = TachUI as any
    console.log('TachUI imported successfully:', Object.keys(core).slice(0, 10))
    
    if (typeof core.mountRoot === 'function') {
      console.log('mountRoot function found')
      
      try {
        core.mountRoot(() => {
          console.log('mountRoot callback called')
          
          // Create the simplest possible component
          const textComponent = core.text('Simple test')
          console.log('Text component created:', textComponent)
          
          return textComponent as any
        })
        console.log('mountRoot call completed')
      } catch (e) {
        console.error('Error in mountRoot:', e)
      }
    } else {
      console.error('mountRoot not found in TachUI exports')
    }
  }).catch(e => {
    console.error('Failed to import TachUI:', e)
  })
} catch (e) {
  console.error('Failed to start import:', e)
}
