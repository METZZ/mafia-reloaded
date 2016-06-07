from server import WebServerSocket
import threading

class MafiaGame:
    def __init__(self):
        ''' Define all init variables and start a thread for the WebServerSocket '''
        self.round = ""
        self.victims = []
        self.mafias = []
        self.detectives = []
        self.wssock = WebServerSocket()
        threading.Thread(target = self.wssock.start, daemon=True).start()

    def type_round(self):
        ''' Waits till all users have joined and then assigns them type and sends namelists'''
        while len(self.wssock.client_list)!=6:   # Wait till we're done with connections
            pass
        self.wssock.send(self.wssock.client_list, "#NAMES:" + ",".join([str(cl) for cl in self.wssock.client_list]))

        # TODO: Make this assignment random, not like it is now.
        self.victims = self.wssock.client_list[:2]
        self.mafias = self.wssock.client_list[2:4]
        self.detectives = self.wssock.client_list[4:]
        self.wssock.send(self.victims, "#TYPE:Victim")
        self.wssock.send(self.mafias, "#TYPE:Mafia")
        # Now wait for all mafia to acknowledge
        self._wait_acknowledge(self.mafias, "#LOADED_MAFIA_JS")
        self.wssock.send(self.detectives, "#TYPE:Detective")
        self._wait_acknowledge(self.detectives, "#LOADED_DETECTIVE_JS")
        self.wssock.send(self.mafias, "#MAFIA_NAMES:" + ",".join([str(m) for m in self.mafias]))
        self.wssock.send(self.detectives, "#DETECTIVE_NAMES:" + ",".join([str(d) for d in self.detectives]))

    def _wait_acknowledge(self, cl_list, message):
        looking_for = {(cl, message) for cl in cl_list}
        forward_q_set = set(self.wssock.forward_q)
        while (forward_q_set | looking_for != forward_q_set):
            looking_for = {(cl, message) for cl in cl_list}
            forward_q_set = set(self.wssock.forward_q)

        with self.wssock.forward_q_lock:
            self.wssock.forward_q = []


    def play(self):
        self.type_round()

MafiaGame().play()
