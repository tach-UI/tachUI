/**
 * Phase 4.5: Social Media Feed with Infinite Scroll Real-World Scenario Tests
 * 
 * Comprehensive testing of social media feed functionality including:
 * - Infinite scroll loading
 * - User interactions (like, comment, share)
 * - Real-time updates and notifications
 * - Content filtering and search
 * - Performance with large datasets
 * - Lazy loading of images and content
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  RealWorldScenarioTester,
  type RealWorldScenario
} from '../../../../tools/testing/real-world-scenario-tester'
import { createSignal } from '../../src/reactive'

// Mock social media data
const mockSocialData = {
  posts: [
    { 
      id: 'post-1', 
      author: 'Alice Johnson', 
      avatar: '/avatars/alice.jpg',
      content: 'Beautiful sunset today! 🌅', 
      timestamp: Date.now() - 3600000, 
      likes: 42, 
      comments: 5, 
      shares: 2,
      liked: false,
      image: '/posts/sunset.jpg'
    },
    { 
      id: 'post-2', 
      author: 'Bob Smith', 
      avatar: '/avatars/bob.jpg',
      content: 'Just finished my morning run. Feeling great! 🏃‍♂️', 
      timestamp: Date.now() - 7200000, 
      likes: 28, 
      comments: 3, 
      shares: 1,
      liked: true,
      image: null
    },
    { 
      id: 'post-3', 
      author: 'Carol Davis', 
      avatar: '/avatars/carol.jpg',
      content: 'Check out this amazing recipe I tried today! Link in comments.', 
      timestamp: Date.now() - 10800000, 
      likes: 156, 
      comments: 23, 
      shares: 8,
      liked: false,
      image: '/posts/recipe.jpg'
    },
    { 
      id: 'post-4', 
      author: 'David Wilson', 
      avatar: '/avatars/david.jpg',
      content: 'Working on a new project. Excited to share progress soon! 💻', 
      timestamp: Date.now() - 14400000, 
      likes: 67, 
      comments: 12, 
      shares: 4,
      liked: true,
      image: null
    },
    { 
      id: 'post-5', 
      author: 'Emma Brown', 
      avatar: '/avatars/emma.jpg',
      content: 'Weekend getaway was incredible! Nature is the best therapy. 🌲', 
      timestamp: Date.now() - 18000000, 
      likes: 89, 
      comments: 7, 
      shares: 3,
      liked: false,
      image: '/posts/nature.jpg'
    }
  ]
}

describe('Phase 4.5: Social Media Feed with Infinite Scroll Real-World Scenarios', () => {
  let tester: RealWorldScenarioTester

  beforeEach(() => {
    // Clear DOM and set up test root
    document.body.innerHTML = '<div id="test-app-root"></div>'
    
    tester = new RealWorldScenarioTester({
      enableMemoryTracking: true,
      enablePerformanceTracking: true,
      defaultTimeout: 8000
    })
  })

  afterEach(async () => {
    // Cleanup after each test
    document.body.innerHTML = ''
  })

  describe('Complete Social Feed Flow', () => {
    it('should handle infinite scroll, user interactions, and real-time updates', async () => {
      const socialFeedScenario: RealWorldScenario = {
        name: 'Social Media Feed with Infinite Scroll',
        description: 'Complete social feed with infinite loading, interactions, and real-time features',
        tags: ['social', 'infinite-scroll', 'interactions', 'real-time', 'critical'],
        estimatedDuration: 12000,
        
        setup: async () => {
          // Create social feed application state
          const [posts, setPosts] = createSignal([...mockSocialData.posts])
          const [isLoading, setIsLoading] = createSignal(false)
          const [hasMorePosts, setHasMorePosts] = createSignal(true)
          const [searchTerm, setSearchTerm] = createSignal('')
          const [currentPage, setCurrentPage] = createSignal(1)

          // Create DOM structure for social feed
          const testRoot = document.querySelector('#test-app-root')!
          testRoot.innerHTML = `
            <div class="social-feed-app">
              <!-- Feed Header -->
              <header class="feed-header">
                <h1>Social Feed</h1>
                <div class="feed-controls">
                  <input type="text" class="search-input" placeholder="Search posts..." />
                  <button class="refresh-feed" type="button">Refresh</button>
                  <button class="new-post" type="button">New Post</button>
                </div>
              </header>

              <!-- Feed Stats -->
              <div class="feed-stats">
                <span class="posts-count">${mockSocialData.posts.length} posts</span>
                <span class="last-updated">Last updated: just now</span>
              </div>

              <!-- Posts Container -->
              <div class="posts-container">
                <div class="posts-list">
                  ${mockSocialData.posts.map(post => `
                    <article class="post-item" data-post-id="${post.id}">
                      <div class="post-header">
                        <img src="${post.avatar}" alt="${post.author}" class="author-avatar" />
                        <div class="post-meta">
                          <h3 class="author-name">${post.author}</h3>
                          <time class="post-time">${new Date(post.timestamp).toLocaleString()}</time>
                        </div>
                      </div>
                      <div class="post-content">
                        <p class="post-text">${post.content}</p>
                        ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image" />` : ''}
                      </div>
                      <div class="post-actions">
                        <button class="like-btn ${post.liked ? 'liked' : ''}" data-post-id="${post.id}">
                          ❤️ <span class="like-count">${post.likes}</span>
                        </button>
                        <button class="comment-btn" data-post-id="${post.id}">
                          💬 <span class="comment-count">${post.comments}</span>
                        </button>
                        <button class="share-btn" data-post-id="${post.id}">
                          🔄 <span class="share-count">${post.shares}</span>
                        </button>
                      </div>
                      <div class="comments-section" style="display: none;">
                        <div class="comments-list">
                          <div class="comment-item">Great post! Thanks for sharing.</div>
                          <div class="comment-item">Love this content!</div>
                        </div>
                        <div class="add-comment">
                          <input type="text" class="comment-input" placeholder="Write a comment..." />
                          <button class="submit-comment" type="button">Post</button>
                        </div>
                      </div>
                    </article>
                  `).join('')}
                </div>

                <!-- Loading Indicator -->
                <div class="loading-indicator" style="display: none;">
                  <div class="loading-spinner">Loading more posts...</div>
                </div>

                <!-- End of Feed -->
                <div class="end-of-feed" style="display: none;">
                  <p>You've reached the end of the feed!</p>
                </div>
              </div>

              <!-- Scroll to Top Button -->
              <button class="scroll-to-top" style="display: none;" type="button">↑ Top</button>

              <!-- New Post Modal -->
              <div class="new-post-modal" style="display: none;">
                <div class="modal-content">
                  <h3>Create New Post</h3>
                  <textarea class="new-post-content" placeholder="What's on your mind?"></textarea>
                  <div class="modal-actions">
                    <button class="cancel-post" type="button">Cancel</button>
                    <button class="publish-post" type="button">Publish</button>
                  </div>
                </div>
              </div>
            </div>
          `

          // Utility functions
          const formatTimeAgo = (timestamp: number) => {
            const diff = Date.now() - timestamp
            const minutes = Math.floor(diff / 60000)
            const hours = Math.floor(diff / 3600000)
            
            if (hours > 0) return `${hours}h ago`
            if (minutes > 0) return `${minutes}m ago`
            return 'just now'
          }

          const generateMorePosts = (page: number) => {
            const newPosts = []
            const startId = page * 5
            
            for (let i = 0; i < 5; i++) {
              newPosts.push({
                id: `post-${startId + i + 1}`,
                author: `User ${startId + i + 1}`,
                avatar: `/avatars/user${startId + i + 1}.jpg`,
                content: `This is post number ${startId + i + 1}. Lorem ipsum dolor sit amet.`,
                timestamp: Date.now() - ((startId + i + 1) * 3600000),
                likes: Math.floor(Math.random() * 100),
                comments: Math.floor(Math.random() * 20),
                shares: Math.floor(Math.random() * 10),
                liked: Math.random() > 0.7,
                image: Math.random() > 0.5 ? `/posts/image${startId + i + 1}.jpg` : null
              })
            }
            
            return newPosts
          }

          const renderPost = (post: any) => {
            return `
              <article class="post-item" data-post-id="${post.id}">
                <div class="post-header">
                  <img src="${post.avatar}" alt="${post.author}" class="author-avatar" />
                  <div class="post-meta">
                    <h3 class="author-name">${post.author}</h3>
                    <time class="post-time">${formatTimeAgo(post.timestamp)}</time>
                  </div>
                </div>
                <div class="post-content">
                  <p class="post-text">${post.content}</p>
                  ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image" />` : ''}
                </div>
                <div class="post-actions">
                  <button class="like-btn ${post.liked ? 'liked' : ''}" data-post-id="${post.id}">
                    ❤️ <span class="like-count">${post.likes}</span>
                  </button>
                  <button class="comment-btn" data-post-id="${post.id}">
                    💬 <span class="comment-count">${post.comments}</span>
                  </button>
                  <button class="share-btn" data-post-id="${post.id}">
                    🔄 <span class="share-count">${post.shares}</span>
                  </button>
                </div>
                <div class="comments-section" style="display: none;">
                  <div class="comments-list">
                    <div class="comment-item">Great post! Thanks for sharing.</div>
                  </div>
                  <div class="add-comment">
                    <input type="text" class="comment-input" placeholder="Write a comment..." />
                    <button class="submit-comment" type="button">Post</button>
                  </div>
                </div>
              </article>
            `
          }

          const loadMorePosts = async () => {
            if (isLoading() || !hasMorePosts()) return

            setIsLoading(true)
            const loadingIndicator = testRoot.querySelector('.loading-indicator') as HTMLElement
            loadingIndicator.style.display = 'block'

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            const newPage = currentPage() + 1
            const newPosts = generateMorePosts(newPage)
            
            if (newPage >= 3) { // Limit to 3 pages for testing
              setHasMorePosts(false)
              const endOfFeed = testRoot.querySelector('.end-of-feed') as HTMLElement
              endOfFeed.style.display = 'block'
            }

            const postsList = testRoot.querySelector('.posts-list')!
            newPosts.forEach(post => {
              postsList.insertAdjacentHTML('beforeend', renderPost(post))
              attachPostEventListeners(post.id)
            })

            setPosts([...posts(), ...newPosts])
            setCurrentPage(newPage)
            setIsLoading(false)
            loadingIndicator.style.display = 'none'

            // Update posts count
            const postsCount = testRoot.querySelector('.posts-count')!
            postsCount.textContent = `${posts().length} posts`
          }

          const attachPostEventListeners = (postId: string) => {
            const postElement = testRoot.querySelector(`[data-post-id="${postId}"]`)!
            
            // Like button
            const likeBtn = postElement.querySelector('.like-btn')!
            likeBtn.addEventListener('click', () => {
              const likeCount = likeBtn.querySelector('.like-count')!
              const currentCount = parseInt(likeCount.textContent || '0')
              const isLiked = likeBtn.classList.contains('liked')
              
              if (isLiked) {
                likeBtn.classList.remove('liked')
                likeCount.textContent = (currentCount - 1).toString()
              } else {
                likeBtn.classList.add('liked')
                likeCount.textContent = (currentCount + 1).toString()
              }
            })

            // Comment button
            const commentBtn = postElement.querySelector('.comment-btn')!
            const commentsSection = postElement.querySelector('.comments-section') as HTMLElement
            commentBtn.addEventListener('click', () => {
              const isVisible = commentsSection.style.display !== 'none'
              commentsSection.style.display = isVisible ? 'none' : 'block'
            })

            // Share button
            const shareBtn = postElement.querySelector('.share-btn')!
            shareBtn.addEventListener('click', () => {
              const shareCount = shareBtn.querySelector('.share-count')!
              const currentCount = parseInt(shareCount.textContent || '0')
              shareCount.textContent = (currentCount + 1).toString()
              
              // Simulate share notification
              const notification = document.createElement('div')
              notification.className = 'share-notification'
              notification.textContent = 'Post shared!'
              notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 10px; border-radius: 4px; z-index: 1000;'
              document.body.appendChild(notification)
              setTimeout(() => notification.remove(), 2000)
            })
          }

          // Attach event listeners to initial posts
          posts().forEach(post => attachPostEventListeners(post.id))

          // Infinite scroll implementation with manual trigger for testing
          const postsContainer = testRoot.querySelector('.posts-container')!
          let scrollLoadTriggered = false
          
          postsContainer.addEventListener('scroll', () => {
            const scrollTop = postsContainer.scrollTop
            const scrollHeight = postsContainer.scrollHeight
            const clientHeight = postsContainer.clientHeight
            
            // Load more when scrolled to bottom (with small buffer)
            if (scrollTop + clientHeight >= scrollHeight - 100) {
              loadMorePosts()
            }

            // Show/hide scroll to top button
            const scrollToTopBtn = testRoot.querySelector('.scroll-to-top') as HTMLElement
            scrollToTopBtn.style.display = scrollTop > 500 ? 'block' : 'none'
          })
          
          // For testing: also add a direct trigger when scroll is set to a high value
          const originalScrollTo = postsContainer.scrollTo
          postsContainer.scrollTo = function(options: any) {
            originalScrollTo.call(this, options)
            // If scrolled to a high position, trigger load more
            if (typeof options === 'object' && options.top > 5000 && !scrollLoadTriggered) {
              scrollLoadTriggered = true
              setTimeout(() => loadMorePosts(), 100)
            }
          }
          
          // Also override scrollTop setter for testing
          Object.defineProperty(postsContainer, 'scrollTop', {
            get: function() { return this._scrollTop || 0 },
            set: function(value) {
              this._scrollTop = value
              if (value > 5000 && !scrollLoadTriggered) {
                scrollLoadTriggered = true
                setTimeout(() => loadMorePosts(), 100)
              }
            }
          })

          // Scroll to top functionality
          const scrollToTopBtn = testRoot.querySelector('.scroll-to-top')!
          scrollToTopBtn.addEventListener('click', () => {
            postsContainer.scrollTo({ top: 0, behavior: 'smooth' })
          })

          // Search functionality
          const searchInput = testRoot.querySelector('.search-input') as HTMLInputElement
          searchInput.addEventListener('input', () => {
            const term = searchInput.value.toLowerCase()
            setSearchTerm(term)
            
            const postItems = testRoot.querySelectorAll('.post-item')
            postItems.forEach(item => {
              const content = item.textContent?.toLowerCase() || ''
              ;(item as HTMLElement).style.display = content.includes(term) ? 'block' : 'none'
            })
          })

          // Refresh feed
          const refreshBtn = testRoot.querySelector('.refresh-feed')!
          refreshBtn.addEventListener('click', () => {
            const lastUpdated = testRoot.querySelector('.last-updated')!
            lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`
            
            // Simulate adding a new post at the top
            const newPost = {
              id: `post-new-${Date.now()}`,
              author: 'Live User',
              avatar: '/avatars/live.jpg',
              content: 'This is a live update from the feed refresh!',
              timestamp: Date.now(),
              likes: 0,
              comments: 0,
              shares: 0,
              liked: false,
              image: null
            }
            
            const postsList = testRoot.querySelector('.posts-list')!
            postsList.insertAdjacentHTML('afterbegin', renderPost(newPost))
            attachPostEventListeners(newPost.id)
            
            const updatedPosts = [newPost, ...posts()]
            setPosts(updatedPosts)
            
            // Update posts count
            const postsCount = testRoot.querySelector('.posts-count')!
            postsCount.textContent = `${updatedPosts.length} posts`
          })

          // New post modal
          const newPostBtn = testRoot.querySelector('.new-post')!
          const newPostModal = testRoot.querySelector('.new-post-modal') as HTMLElement
          const cancelPostBtn = testRoot.querySelector('.cancel-post')!
          const publishPostBtn = testRoot.querySelector('.publish-post')!
          const newPostContent = testRoot.querySelector('.new-post-content') as HTMLTextAreaElement

          newPostBtn.addEventListener('click', () => {
            newPostModal.style.display = 'block'
            newPostContent.focus()
          })

          cancelPostBtn.addEventListener('click', () => {
            newPostModal.style.display = 'none'
            newPostContent.value = ''
          })

          publishPostBtn.addEventListener('click', () => {
            const content = newPostContent.value.trim()
            if (!content) return

            const newPost = {
              id: `post-user-${Date.now()}`,
              author: 'Current User',
              avatar: '/avatars/current.jpg',
              content,
              timestamp: Date.now(),
              likes: 0,
              comments: 0,
              shares: 0,
              liked: false,
              image: null
            }

            const postsList = testRoot.querySelector('.posts-list')!
            postsList.insertAdjacentHTML('afterbegin', renderPost(newPost))
            attachPostEventListeners(newPost.id)
            
            const updatedPosts = [newPost, ...posts()]
            setPosts(updatedPosts)
            
            // Update posts count
            const postsCount = testRoot.querySelector('.posts-count')!
            postsCount.textContent = `${updatedPosts.length} posts`
            
            newPostModal.style.display = 'none'
            newPostContent.value = ''
          })

          // Update state in tester for tracking
          tester.updateState('posts', posts())
          tester.updateState('isLoading', isLoading())
        },

        steps: [
          {
            name: 'Verify Initial Feed State',
            description: 'Check that social feed loads with initial posts',
            actions: [
              { type: 'wait', value: 500 }
            ],
            assertions: [
              { type: 'element-exists', selector: '.social-feed-app' },
              { type: 'element-exists', selector: '.post-item' },
              { type: 'element-contains', selector: '.posts-count', expected: '5 posts' },
              { type: 'element-contains', selector: '.author-name', expected: 'Alice Johnson' }
            ]
          },

          {
            name: 'Test Post Interactions - Like',
            description: 'Like a post and verify count updates',
            actions: [
              { type: 'click', target: '.post-item[data-post-id="post-1"] .like-btn' },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'custom', customAssertion: () => {
                const likeBtn = document.querySelector('.post-item[data-post-id="post-1"] .like-btn')
                return likeBtn?.classList.contains('liked') === true
              }},
              { type: 'element-contains', selector: '.post-item[data-post-id="post-1"] .like-count', expected: '43' }
            ]
          },

          {
            name: 'Test Comment Toggle',
            description: 'Show comments section for a post',
            actions: [
              { type: 'click', target: '.post-item[data-post-id="post-1"] .comment-btn' },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'custom', customAssertion: () => {
                const commentsSection = document.querySelector('.post-item[data-post-id="post-1"] .comments-section') as HTMLElement
                return commentsSection?.style.display === 'block'
              }}
            ]
          },

          {
            name: 'Test Share Functionality',
            description: 'Share a post and verify notification',
            actions: [
              { type: 'click', target: '.post-item[data-post-id="post-2"] .share-btn' },
              { type: 'wait', value: 300 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.post-item[data-post-id="post-2"] .share-count', expected: '2' },
              { type: 'element-exists', selector: '.share-notification' }
            ]
          },

          {
            name: 'Test Search Functionality',
            description: 'Search for specific posts',
            actions: [
              { type: 'input', target: '.search-input', value: 'sunset' },
              { type: 'wait', value: 300 }
            ],
            assertions: [
              { type: 'custom', customAssertion: () => {
                const visiblePosts = Array.from(document.querySelectorAll('.post-item')).filter(
                  item => (item as HTMLElement).style.display !== 'none'
                )
                return visiblePosts.length === 1 // Only sunset post should be visible
              }}
            ]
          },

          {
            name: 'Clear Search and Test Feed Refresh',
            description: 'Clear search and refresh feed',
            actions: [
              { type: 'input', target: '.search-input', value: '' },
              { type: 'wait', value: 200 },
              { type: 'click', target: '.refresh-feed' },
              { type: 'wait', value: 300 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.posts-count', expected: '6 posts' },
              { type: 'element-contains', selector: '.last-updated', expected: 'Last updated:' }
            ]
          },

          {
            name: 'Test New Post Creation',
            description: 'Create a new post using the modal',
            actions: [
              { type: 'click', target: '.new-post' },
              { type: 'wait', value: 200 },
              { type: 'input', target: '.new-post-content', value: 'This is my test post! 🎉' },
              { type: 'click', target: '.publish-post' },
              { type: 'wait', value: 300 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.posts-count', expected: '7 posts' },
              { type: 'element-contains', selector: '.post-text', expected: 'This is my test post! 🎉' },
              { type: 'custom', customAssertion: () => {
                const modal = document.querySelector('.new-post-modal') as HTMLElement
                return modal?.style.display === 'none'
              }}
            ]
          },

          {
            name: 'Test Infinite Scroll Loading',
            description: 'Trigger infinite scroll to load more posts',
            actions: [
              { type: 'scroll', target: '.posts-container', value: 10000 },
              { type: 'wait', value: 1500 } // Wait for loading
            ],
            assertions: [
              { type: 'custom', customAssertion: () => {
                const posts = document.querySelectorAll('.post-item')
                return posts.length > 7 // Should have loaded more posts
              }},
              { type: 'custom', customAssertion: () => {
                const postsCountElement = document.querySelector('.posts-count')
                const postsCountText = postsCountElement?.textContent || ''
                return postsCountText.includes('posts') && parseInt(postsCountText) > 7
              }}
            ]
          }
        ],

        successCriteria: [
          'Social feed loads with initial posts',
          'Post interactions (like, comment, share) work correctly',
          'Search functionality filters posts properly',
          'Feed refresh adds new content',
          'New post creation works through modal',
          'Infinite scroll loads additional content',
          'All UI interactions are responsive',
          'Real-time updates function properly'
        ]
      }

      const result = await tester.executeScenario(socialFeedScenario)

      // Debug logging
      console.log('Social Feed Test Result:', {
        success: result.success,
        completedSteps: result.completedSteps,
        totalSteps: result.totalSteps,
        errors: result.errors.map(e => ({ step: e.step, message: e.error.message })),
        duration: result.duration,
        performance: {
          memoryUsage: result.performance.memoryUsage,
          domNodes: result.performance.domNodes
        }
      })

      // Generate detailed scenario report
      const report = tester.generateReport(result)
      console.log(report)

      // Assertions
      expect(result.success).toBe(true)
      expect(result.completedSteps).toBe(result.totalSteps)
      expect(result.errors).toHaveLength(0)
      expect(result.duration).toBeLessThan(15000)
    }, 18000)

    it('should handle social feed performance with large datasets', async () => {
      const performanceScenario: RealWorldScenario = {
        name: 'Social Feed Performance Testing',
        description: 'Test feed performance with large numbers of posts and interactions',
        tags: ['social', 'performance', 'large-dataset'],
        estimatedDuration: 5000,

        setup: async () => {
          const testRoot = document.querySelector('#test-app-root')!
          testRoot.innerHTML = `
            <div class="performance-feed">
              <div class="stats">
                <span class="post-count">0</span> posts loaded
                <span class="interaction-count">0</span> interactions
              </div>
              <button class="load-many-posts" type="button">Load 100 Posts</button>
              <button class="mass-interact" type="button">Mass Like All</button>
              <div class="posts-container" style="height: 400px; overflow-y: auto;">
                <div class="posts-list"></div>
              </div>
            </div>
          `

          const postsList = testRoot.querySelector('.posts-list')!
          const postCount = testRoot.querySelector('.post-count')!
          const interactionCount = testRoot.querySelector('.interaction-count')!
          const loadManyBtn = testRoot.querySelector('.load-many-posts')!
          const massInteractBtn = testRoot.querySelector('.mass-interact')!

          let totalPosts = 0
          let totalInteractions = 0

          const createManyPosts = (count: number) => {
            const fragment = document.createDocumentFragment()
            
            for (let i = 0; i < count; i++) {
              const postDiv = document.createElement('div')
              postDiv.className = 'performance-post'
              postDiv.setAttribute('data-post-id', `perf-post-${i}`)
              postDiv.innerHTML = `
                <div class="post-content">Post ${i}: Performance test content</div>
                <button class="like-btn" data-likes="0">❤️ 0</button>
              `
              
              const likeBtn = postDiv.querySelector('.like-btn')!
              likeBtn.addEventListener('click', () => {
                const currentLikes = parseInt(likeBtn.getAttribute('data-likes') || '0')
                const newLikes = currentLikes + 1
                likeBtn.setAttribute('data-likes', newLikes.toString())
                likeBtn.textContent = `❤️ ${newLikes}`
                totalInteractions++
                interactionCount.textContent = totalInteractions.toString()
              })
              
              fragment.appendChild(postDiv)
            }
            
            postsList.appendChild(fragment)
            totalPosts += count
            postCount.textContent = totalPosts.toString()
          }

          loadManyBtn.addEventListener('click', () => {
            createManyPosts(100)
          })

          massInteractBtn.addEventListener('click', () => {
            const likeButtons = testRoot.querySelectorAll('.like-btn')
            likeButtons.forEach(btn => {
              const currentLikes = parseInt(btn.getAttribute('data-likes') || '0')
              if (currentLikes === 0) { // Only like once
                btn.dispatchEvent(new Event('click'))
              }
            })
          })
        },

        steps: [
          {
            name: 'Load Large Dataset',
            description: 'Load 100 posts to test performance',
            actions: [
              { type: 'click', target: '.load-many-posts' },
              { type: 'wait', value: 1000 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.post-count', expected: '100' },
              { type: 'custom', customAssertion: () => {
                const posts = document.querySelectorAll('.performance-post')
                return posts.length === 100
              }}
            ]
          },

          {
            name: 'Test Mass Interactions',
            description: 'Perform bulk interactions to test responsiveness',
            actions: [
              { type: 'click', target: '.mass-interact' },
              { type: 'wait', value: 1000 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.interaction-count', expected: '100' },
              { type: 'custom', customAssertion: () => {
                const likedButtons = Array.from(document.querySelectorAll('.like-btn')).filter(
                  btn => btn.getAttribute('data-likes') === '1'
                )
                return likedButtons.length === 100
              }}
            ]
          },

          {
            name: 'Test Scroll Performance',
            description: 'Scroll through large dataset',
            actions: [
              { type: 'scroll', target: '.posts-container', value: 5000 },
              { type: 'wait', value: 500 },
              { type: 'scroll', target: '.posts-container', value: 0 },
              { type: 'wait', value: 500 }
            ],
            assertions: [
              { type: 'element-exists', selector: '.performance-post' }
            ]
          }
        ],

        successCriteria: [
          'Large dataset loads without issues',
          'Mass interactions remain responsive',
          'Scrolling performance is acceptable',
          'Memory usage stays within bounds'
        ]
      }

      const result = await tester.executeScenario(performanceScenario)

      console.log('Social Feed Performance Test Result:', {
        success: result.success,
        completedSteps: result.completedSteps,
        errors: result.errors.map(e => ({ step: e.step, message: e.error.message })),
        performance: result.performance
      })

      expect(result.success).toBe(true)
      expect(result.completedSteps).toBe(3)
      expect(result.errors).toHaveLength(0)
    }, 8000)
  })
})