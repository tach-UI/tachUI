#!/usr/bin/env node

import('../dist/index.js')
  .then(({ main }) => {
    main()
  })
  .catch((error) => {
    console.error('Failed to start Tacho CLI:', error)
    process.exit(1)
  })
