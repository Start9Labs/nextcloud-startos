# Wrapper for Nextcloud
`Nextcloud` is a browser-based productivity platform. This `.s9pk` wrapper will allow you to run Nextcloud on your Start9 server.

## Dependencies
- [docker](https://docs.docker.com/get-docker)
- [docker-buildx](https://docs.docker.com/buildx/working-with-buildx/)
- [yq](https://mikefarah.gitbook.io/yq)
- [toml](https://crates.io/crates/toml-cli)
- [start-sdk](https://github.com/Start9Labs/start-os/tree/master/core)
- [make](https://www.gnu.org/software/make/)
- [deno](https://deno.land/)

## Build enviroment (Ubuntu example)
Prepare your build enviroment

1. Install build packages
```
sudo apt-get install -y build-essential openssl libssl-dev libc6-dev clang libclang-dev ca-certificates
```
2. Install docker
```
curl -fsSL https://get.docker.com -o- | bash
sudo usermod -aG docker "$USER"
exec sudo su -l $USER
```
3. Set buildx as the default builder
```
docker buildx install
docker buildx create --use
```
4. Enable cross-arch emulated builds in docker
```
docker run --privileged --rm linuxkit/binfmt:v0.8
```
5. Install yq
```
sudo snap install yq
```
6. Install Rust
```
curl https://sh.rustup.rs -sSf | sh
# Choose 1 (default install)
source $HOME/.cargo/env
```
7. Install toml
```
cargo install toml-cli
```
8. Build and install start-sdk
```
git clone https://github.com/Start9Labs/start-os.git
cd start-os
make sdk
```

## Build s9pk
Clone the project locally:
```
git clone https://github.com/Start9Labs/nextcloud-startos.git
cd nextcloud-startos
```

To build, simply run:
```
make
```

## Installing
On StartOS, navigate to System -> Sideload a Service, and select the `nextcloud.s9pk`

Alternatively, you may use `start-cli`:
1. [SSH](https://docs.start9.com/latest/user-manual/ssh) into your server
2. `scp` the `nextcloud.s9pk` file to your server
3. `start-cli package install nextcloud.s9pk`
