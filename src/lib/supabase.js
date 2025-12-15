import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let _client = null

function createClientIfNeeded() {
  if (_client) return _client

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Supabase environment variables are missing. Supabase client will not be initialized. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    )

    // Return a proxy that throws clearly when used so imports don't fail at module-eval time
    _client = new Proxy(
      {},
      {
        get() {
          throw new Error(
            'Supabase client not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
          )
        },
        apply() {
          throw new Error(
            'Supabase client not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
          )
        },
      }
    )

    return _client
  }

  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  return _client
}

// Export a proxy that lazily initializes the actual client when a property is accessed.
export const supabase = new Proxy(
  {},
  {
    get(_, prop) {
      const client = createClientIfNeeded()
      const value = client[prop]
      // If it's a function, bind it to the real client to preserve `this`.
      if (typeof value === 'function') return value.bind(client)
      return value
    },
    apply(_, thisArg, args) {
      const client = createClientIfNeeded()
      return client.apply(thisArg, args)
    },
  }
)

// Helper function to handle Supabase errors with a normalized shape
export const handleSupabaseError = (error) => {
  console.error('Supabase error:', error)
  if (!error) return { message: 'Unknown error', code: null, details: null }
  return {
    message: error.message || String(error),
    code: error.code || null,
    details: error.details || null,
  }
}

