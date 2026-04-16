import { Link } from 'react-router-dom';
import { Film, Twitter, Instagram, Youtube, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="flex justify-center">
          <div className="flex flex-col items-center text-center max-w-sm">
            {/* Brand */}
            <div>
              <Link to="/" className="flex items-center justify-center gap-2 mb-4">
                <Film className="w-8 h-8 text-primary" />
                <span className="font-display text-xl text-foreground tracking-wider">
                  DTPLEX
                </span>
              </Link>
              <p className="text-sm text-muted-foreground mb-4">
                Your premium destination for movies, social viewing, and endless entertainment.
              </p>
              <div className="flex gap-4 justify-center">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Browse */}
            {/* <div>
              <h4 className="font-semibold text-foreground mb-4">Browse</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/movies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    All Movies
                  </Link>
                </li>
                <li>
                  <Link to="/movies?genre=action" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Action
                  </Link>
                </li>
                <li>
                  <Link to="/movies?genre=horror" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Horror
                  </Link>
                </li>
                <li>
                  <Link to="/movies?genre=sci-fi" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Sci-Fi
                  </Link>
                </li>
                <li>
                  <Link to="/movies?genre=comedy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Comedy
                  </Link>
                </li>
              </ul>
            </div> */}

            {/* Community */}
            {/* <div>
              <h4 className="font-semibold text-foreground mb-4">Community</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/groups" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Groups
                  </Link>
                </li>
                <li>
                  <Link to="/watch-party" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Watch Parties
                  </Link>
                </li>
                <li>
                  <Link to="/playlists" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Playlists
                  </Link>
                </li>
              </ul>
            </div> */}

            {/* Legal */}
            {/* <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div> */}
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} DTPlex. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
