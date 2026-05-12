FROM ubuntu:22.04

LABEL maintainer="alwayscodex"

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Jakarta

RUN apt update -y > /dev/null 2>&1 && apt upgrade -y > /dev/null 2>&1 && apt install locales -y \
    && localedef -i en_US -c -f UTF-8 -A /usr/share/locale.alias en_US.UTF-8
RUN apt install ssh wget curl -y > /dev/null 2>&1

# Install bore (free TCP tunnel, no signup required, runs 24/7)
RUN curl -fsSL https://github.com/ekzhang/bore/releases/download/v0.6.0/bore-v0.6.0-x86_64-unknown-linux-musl.tar.gz \
    | tar xz -C /usr/local/bin

RUN echo "bore local 22 --to bore.pub &>/dev/null &" >> /start
RUN mkdir /run/sshd
RUN echo '/usr/sbin/sshd -D' >> /start
RUN echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config
RUN echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config
RUN echo root:admin | chpasswd
RUN service ssh start
RUN chmod 755 /start

EXPOSE 80 8888 8080 443 5130 5131 5132 5133 5134 5135 3306

CMD /start
