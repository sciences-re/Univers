{
  inputs = { nixpkgs.url = "github:NixOS/nixpkgs/nixos-22.11"; };

  outputs = { self, nixpkgs }:
    let
      pkgs = nixpkgs.legacyPackages.x86_64-linux;
      create-react-app = pkgs.nodePackages.create-react-app.override {
        preRebuild = ''
          substituteInPlace $(find -type f -name createReactApp.js) \
              --replace "path.join(root, 'yarn.lock')" "path.join(root, 'yarn.lock')); fs.chmodSync(path.join(root, 'yarn.lock'), 0o644"
        '';
      };
      mypython3 = pkgs.python3.withPackages (ps: with ps; [ nltk pandas pdfminer beautifulsoup4 aiohttp ]);
    in
    {
      devShell.x86_64-linux =
        with pkgs;
        pkgs.mkShell {
          buildInputs = [
            create-react-app
            nodejs
            yarn
            mypython3
            cacert
          ];
          shellHook = ''
            export PATH="$PWD/node_modules/.bin/:$PATH"
          '';
        };
    };
}
